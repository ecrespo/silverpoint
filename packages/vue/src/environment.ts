import { FORCED_PRECISION_QUERY, type ProviderConfig } from '@silverpoint/core';
import { inject, onBeforeUnmount, onMounted, ref, type InjectionKey, type Plugin, type Ref } from 'vue';

export const SILVERPOINT: InjectionKey<ProviderConfig> = Symbol('silverpoint');

/** Plugin that sets ground, substrate, mode and locale once for the app (API Spec §8.3). */
export function provideSilverpoint(config: ProviderConfig): Plugin {
  return {
    install(app) {
      app.provide(SILVERPOINT, config);
    },
  };
}

export function useProvider(): ProviderConfig {
  return inject(SILVERPOINT, {});
}

/**
 * Whether the environment forces `precision` (REQ-123). One ref shared by every chart — it is
 * the environment's state, not the component's (REQ-108) — read after hydration (REQ-109).
 */
const forced = ref(false);
let watching = false;

export function useForcedPrecision(): Ref<boolean> {
  onMounted(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(FORCED_PRECISION_QUERY);
    const update = () => {
      forced.value = query.matches;
    };
    update();
    if (watching) return;
    watching = true;
    query.addEventListener?.('change', update);
  });
  return forced;
}

/** Container width measured with ResizeObserver; the one piece of local state (REQ-108, REQ-009). */
export function useMeasuredWidth(element: Ref<HTMLElement | undefined>, enabled: () => boolean): Ref<number | undefined> {
  const width = ref<number | undefined>(undefined);
  let observer: ResizeObserver | undefined;
  onMounted(() => {
    if (!enabled() || !element.value || typeof ResizeObserver !== 'function') return;
    observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) width.value = entry.contentRect.width;
    });
    observer.observe(element.value);
  });
  onBeforeUnmount(() => observer?.disconnect());
  return width;
}
