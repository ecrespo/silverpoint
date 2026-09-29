import type { UiItem, UiOrientation } from '@silverpoint/core/ui';
import type { PropType } from 'vue';

/** The props of a composite's items and orientation. */
export const itemsProp = { type: Array as PropType<readonly UiItem[]>, required: true } as const;
export const orientationProp = String as PropType<UiOrientation>;
