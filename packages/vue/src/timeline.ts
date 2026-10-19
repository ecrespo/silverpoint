import { timelineMount, timelineView, type SpTimelineProps, type TimelineData, type TimelineJsModule } from '@silverpoint/core/timeline';
import { defineComponent, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './ui/base';
import { renderUi } from './ui/render';

/**
 * TimelineJS's module without its package entry, which imports a Less stylesheet no consumer bundler
 * loads; the literal path lets the consumer's bundler split it into a chunk of its own.
 */
// @ts-expect-error TimelineJS ships no types; the module is read as `TimelineJsModule`.
const load = () => import('@knight-lab/timelinejs/src/js/timeline/Timeline.js') as Promise<TimelineJsModule>;

/** `SpTimeline`: TimelineJS inked by the ground, loaded on the client only (REQ-510..REQ-515). */
export const SpTimeline = defineComponent({
  name: 'SpTimeline',
  inheritAttrs: false,
  props: {
    ...COMMON,
    data: { type: Object as PropType<TimelineData>, required: true },
    options: Object as PropType<SpTimelineProps['options']>,
    height: String,
    inkedFrames: optionalBoolean,
    card: optionalBoolean,
    label: String,
  },
  emits: ['change', 'loaded', 'navNext', 'navPrevious', 'zoomIn', 'zoomOut', 'backToStart'],
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const failed = ref(false);
    const host = ref<HTMLElement | null>(null);
    let stop = () => {};
    // Client only: neither hook runs during server rendering (REQ-513).
    const start = () => {
      stop();
      if (!host.value) return;
      stop = timelineMount(host.value, {
        load,
        data: props.data,
        options: props.options,
        inked: props.inkedFrames,
        emit: (event, ...value) => (emit as (event: string, ...value: unknown[]) => void)(event, ...value),
        failed: () => (failed.value = true),
      });
    };
    onMounted(start);
    watch(() => [props.data, props.options, props.inkedFrames], start);
    onBeforeUnmount(() => stop());
    return () =>
      renderUi(timelineView(withClass(props as SpTimelineProps, attrs), resolved.value, { failed: failed.value }), { root: { ref: host }, slots: { fallback: slots.fallback?.() } });
  },
});
