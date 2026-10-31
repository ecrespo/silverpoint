import type { ProviderConfig } from '@silverpoint/core';
import { createDeckController, createDeckEngine, deckView, hydrationPlan, sanitiseDeckId, type DeckController, type DeckMode, type DeckSize, type ViewAttrs } from '@silverpoint/marp';
import { attachDeck, fullscreenAvailable } from '@silverpoint/marp/client';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  render as renderVNode,
  shallowRef,
  useId,
  watch,
  type Component,
  type PropType,
} from 'vue';
import { useProvider } from '../environment';
import { renderUi } from '../ui/render';
import { CHART_LOADERS } from './chart-loaders';

/** The view's attributes as Vue props: a `true` flag is an empty attribute, as on the server. */
function props(attrs: ViewAttrs): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) out[name] = value === true ? '' : value;
  return out;
}

const groundName = (ground: ProviderConfig['ground']) => (typeof ground === 'string' ? ground : ground?.name);

/**
 * `SpDeck` (T-274, REQ-608, REQ-610..REQ-612, API delta §6): a Marp/Marpit Markdown deck in the
 * ground's hand. The markup is `deckView`'s (Art. 2, Art. 3); this binds it: the controller's state
 * in a `shallowRef`, `v-model:page`, the client half after mount (`attachDeck`), and each fence
 * chart rendered into its slot with `render(h())` and the app's context, in place of its static SVG.
 */
export const SpDeck = defineComponent({
  name: 'SpDeck',
  props: {
    markdown: { type: String, required: true },
    page: Number,
    defaultPage: Number,
    id: String,
    label: String,
    theme: String,
    ground: String,
    substrate: String,
    mode: String as PropType<DeckMode>,
    palette: String,
    size: String as PropType<DeckSize>,
    showNotes: { type: Boolean, default: false },
    showControls: { type: Boolean, default: true },
    keyboard: { type: Boolean, default: true },
    swipe: { type: Boolean, default: true },
    hash: { type: Boolean, default: false },
    interactive: { type: Boolean, default: true },
  },
  emits: ['pageChange', 'fragmentChange', 'ready', 'update:page'],
  setup(p, { emit }) {
    const provider = useProvider();
    const instance = getCurrentInstance();
    // Vue's useId counts per application, so a server render and the hydrating client agree (REQ-612).
    const generated = useId();

    const resolved = computed(() => {
      const ground = p.ground ?? groundName(provider.ground) ?? 'silverpoint';
      const substrate = p.substrate ?? (p.ground === undefined ? (provider.substrate as string | undefined) : undefined);
      return { ground, substrate, mode: p.mode ?? provider.mode ?? 'ink', palette: p.palette ?? provider.palette, locale: provider.locale };
    });
    const deckId = computed(() => sanitiseDeckId(p.id ?? generated));
    const render = computed(() => {
      const r = resolved.value;
      return createDeckEngine({
        id: deckId.value,
        ground: r.ground,
        ...(r.substrate === undefined ? {} : { substrate: r.substrate }),
        mode: r.mode,
        ...(p.theme === undefined ? {} : { theme: p.theme }),
        ...(p.size === undefined ? {} : { size: p.size }),
        ...(r.locale === undefined ? {} : { locale: r.locale }),
        ...(r.palette === undefined ? {} : { palette: r.palette }),
      }).render(p.markdown);
    });
    const steps = () => render.value.slides.map((s) => s.fragments);

    const controller: DeckController = createDeckController({
      total: render.value.total,
      steps: steps(),
      ...(p.page === undefined ? (p.defaultPage === undefined ? {} : { defaultPage: p.defaultPage }) : { page: p.page }),
    });
    const state = shallowRef(controller.state);
    const off = [
      controller.on('state', (s) => (state.value = s)),
      controller.on('pageChange', (payload) => {
        emit('pageChange', payload);
        emit('update:page', payload.page);
      }),
      controller.on('fragmentChange', (payload) => emit('fragmentChange', payload)),
      controller.on('ready', (payload) => emit('ready', payload)),
    ];
    if (p.showNotes) controller.toggleNotes(true);

    watch(render, (next) => controller.setTotal(next.total, steps()));
    watch(() => p.page, (page) => page !== undefined && controller.setControlledPage(page));
    watch(() => p.showNotes, (show) => controller.toggleNotes(show));

    // Known after mount only, so the server and the first client render agree (REQ-603, REQ-612).
    const canFullscreen = ref(false);
    const root = ref<HTMLElement | null>(null);
    let detach = () => {};

    const attach = () => {
      detach();
      const element = root.value;
      if (!element) return;
      canFullscreen.value = fullscreenAvailable(element);
      const plan = p.interactive ? hydrationPlan(render.value, resolved.value.palette) : [];
      detach = attachDeck(element, controller, { keyboard: p.keyboard, swipe: p.swipe, hash: p.hash }, {
        plan,
        mountChart: (slot, entry) => {
          let live = true;
          let mounted = false;
          const load = CHART_LOADERS[entry.chart];
          if (load) {
            void load().then((Chart: Component) => {
              if (!live) return;
              // The framework chart replaces the static one: the same tree, now interactive (Art. 3).
              slot.replaceChildren();
              slot.setAttribute('data-sp-hydrated', '');
              const vnode = h(Chart, entry.props);
              // The app's context: the provider and anything the app installed reach the chart.
              vnode.appContext = instance?.appContext ?? null;
              renderVNode(vnode, slot);
              mounted = true;
            });
          }
          return () => {
            live = false;
            if (mounted) renderVNode(null, slot);
          };
        },
      });
    };
    onMounted(attach);
    // After the DOM shows the new slides: `flush: 'post'`.
    watch([render, () => p.interactive, () => p.keyboard, () => p.swipe, () => p.hash], attach, { flush: 'post' });
    onBeforeUnmount(() => {
      detach();
      for (const fn of off) fn();
      controller.destroy();
    });

    return () => {
      const view = deckView(render.value, state.value, {
        ...(p.label === undefined ? {} : { label: p.label }),
        showControls: p.showControls,
        fullscreenAvailable: canFullscreen.value,
        ground: resolved.value.ground,
        ...(resolved.value.substrate === undefined ? {} : { substrate: resolved.value.substrate }),
        mode: resolved.value.mode,
      });
      return h('div', { ...props(view.root), ref: root }, [
        // Vue's server render escapes a style's text (`>` → `&gt;`), breaking the CSS; the engine's
        // CSS holds no `<` (sanitiseDeckCss), so it goes in raw (DD-055, T-277 amendment).
        h('style', { innerHTML: view.css }),
        h('div', props(view.viewport), [
          h(
            'div',
            props(view.container),
            // The engine's own output: Markdown HTML is off and not configurable (REQ-572, REQ-575).
            view.slides.map((slide) => h('div', { key: slide.key, ...props(slide.attrs), innerHTML: slide.html })),
          ),
        ]),
        view.notes ? h('aside', props(view.notes.attrs), view.notes.paragraphs.map((text) => h('p', text))) : null,
        view.controls ? renderUi(view.controls, {}, false) : null,
        h('p', props(view.status.attrs), view.status.text),
      ]);
    };
  },
});
