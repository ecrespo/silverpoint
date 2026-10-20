<script setup lang="ts">
import { uiFixtureParts, type HarnessUiFixture } from '@silverpoint/example-harness';
import {
  SpAlert,
  SpAvatar,
  SpAvatarGroup,
  SpBadge,
  SpBreadcrumb,
  SpButton,
  SpCard,
  SpCheckbox,
  SpCollapse,
  SpCollapseItem,
  SpDescriptions,
  SpDivider,
  SpDrawer,
  SpDropdownMenu,
  SpEmpty,
  SpGlyph,
  SpInput,
  SpInputNumber,
  SpModal,
  SpPagination,
  SpPopover,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpResult,
  SpSegmented,
  SpSelect,
  SpSkeleton,
  SpSlider,
  SpStatistic,
  SpSteps,
  SpSurface,
  SpSwitch,
  SpTable,
  SpTabs,
  SpTag,
  SpTextarea,
  SpTimelineList,
  SpToast,
  SpTooltip,
} from '@silverpoint/vue/ui';
import { computed } from 'vue';

const props = defineProps<{ fixture: HarnessUiFixture }>();

/** Every UI component a fixture can name, by its slug. */
const UI = {
  button: SpButton,
  input: SpInput,
  checkbox: SpCheckbox,
  switch: SpSwitch,
  card: SpCard,
  divider: SpDivider,
  'radio-group': SpRadioGroup,
  segmented: SpSegmented,
  tabs: SpTabs,
  slider: SpSlider,
  rate: SpRate,
  steps: SpSteps,
  tag: SpTag,
  badge: SpBadge,
  progress: SpProgress,
  alert: SpAlert,
  skeleton: SpSkeleton,
  surface: SpSurface,
  table: SpTable,
  pagination: SpPagination,
  breadcrumb: SpBreadcrumb,
  avatar: SpAvatar,
  statistic: SpStatistic,
  descriptions: SpDescriptions,
  'timeline-list': SpTimelineList,
  empty: SpEmpty,
  result: SpResult,
  textarea: SpTextarea,
  'input-number': SpInputNumber,
  modal: SpModal,
  drawer: SpDrawer,
  popover: SpPopover,
  tooltip: SpTooltip,
  select: SpSelect,
  'dropdown-menu': SpDropdownMenu,
  toast: SpToast,
} as const;

/**
 * A UI fixture's component as a consumer writes it: uncontrolled, the value as `default-value` (REQ-322); named
 * slots; an overlay's trigger in its `trigger` slot. Glyph `all`, Avatar `group` and Collapse
 * compose several components.
 */
const parts = computed(() => {
  const { props: all, value, slots, trigger } = uiFixtureParts(props.fixture);
  const { glyphs, avatars, items, ...rest } = all as typeof all & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[]; items?: unknown };
  const common = { ground: all.ground, substrate: all.substrate, mode: all.mode, size: all.size };
  const collapse =
    props.fixture.component === 'collapse'
      ? (items as readonly (Record<string, unknown> & { key: string; content?: string; open?: boolean })[]).map(({ key, content, open, ...item }) => ({ key, content, item: { ...common, ...item, defaultOpen: open } as unknown as typeof common & { title: string } }))
      : undefined;
  return {
    props: all,
    rest,
    common,
    glyphs,
    avatars,
    collapse,
    bound: { ...all, ...(value === undefined ? {} : { defaultValue: value }) },
    slots,
    // The menu draws its own button.
    trigger: props.fixture.component === 'dropdown-menu' ? undefined : trigger,
  };
});
</script>

<template>
  <template v-if="parts.glyphs">
    <SpGlyph v-for="glyph in parts.glyphs" :key="glyph" v-bind="parts.common" :glyph="glyph as never" />
  </template>
  <SpAvatarGroup v-else-if="parts.avatars" v-bind="parts.rest">
    <SpAvatar v-for="(avatar, i) in parts.avatars" :key="i" v-bind="{ ...parts.common, ...(avatar as { name: string }) }" />
  </SpAvatarGroup>
  <SpCollapse v-else-if="parts.collapse" v-bind="parts.rest">
    <SpCollapseItem v-for="entry in parts.collapse" :key="entry.key" v-bind="entry.item">{{ entry.content }}</SpCollapseItem>
  </SpCollapse>
  <component :is="UI[props.fixture.component as keyof typeof UI]" v-else v-bind="parts.bound">
    <template v-if="parts.trigger !== undefined" #trigger>
      <button type="button">{{ parts.trigger }}</button>
    </template>
    <template v-if="parts.slots.content !== undefined" #default>{{ parts.slots.content }}</template>
    <template v-if="parts.slots.extra !== undefined" #extra>{{ parts.slots.extra }}</template>
    <template v-if="parts.slots.footer !== undefined" #footer>{{ parts.slots.footer }}</template>
    <template v-if="parts.slots.action !== undefined" #action>{{ parts.slots.action }}</template>
  </component>
</template>
