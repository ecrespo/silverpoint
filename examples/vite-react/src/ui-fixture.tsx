import { uiFixtureParts, uiSizeOf, type HarnessUiFixture } from '@silverpoint/example-harness';
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
} from '@silverpoint/react/ui';
import type { ComponentType } from 'react';

/** Every UI component a fixture can name, by its slug. */
export const UI = {
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
} as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

type CollapseDemoItem = Record<string, unknown> & { readonly key: string; readonly content?: string; readonly open?: boolean };

/** The component, composed as a consumer writes its demo: Glyph `all`, Avatar `group` and Collapse hold several. */
export function UiComponent({ fixture }: { fixture: HarnessUiFixture }) {
  const { props, value, slots, trigger } = uiFixtureParts(fixture);
  const { glyphs, avatars, items, ...rest } = props as typeof props & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[]; items?: unknown };
  const common = { ground: props.ground, substrate: props.substrate, mode: props.mode, size: props.size };
  if (glyphs) return glyphs.map((glyph) => <SpGlyph key={glyph} {...common} glyph={glyph as never} />);
  if (avatars) {
    return (
      <SpAvatarGroup {...rest}>
        {avatars.map((avatar, i) => (
          <SpAvatar key={i} {...common} {...(avatar as { name: string })} />
        ))}
      </SpAvatarGroup>
    );
  }
  if (fixture.component === 'collapse') {
    return (
      <SpCollapse {...rest}>
        {(items as readonly CollapseDemoItem[]).map(({ key, content, open, ...item }) => (
          <SpCollapseItem key={key} {...common} {...(item as { title: string })} defaultOpen={open}>
            {content}
          </SpCollapseItem>
        ))}
      </SpCollapse>
    );
  }
  const Component = UI[fixture.component]!;
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  const named = {
    ...(slots.extra ? { extra: slots.extra } : {}),
    ...(slots.footer ? { footer: slots.footer } : {}),
    ...(slots.action ? { action: slots.action } : {}),
    // An overlay hangs from its consumer's trigger; the menu draws its own button.
    ...(trigger !== undefined && fixture.component !== 'dropdown-menu' ? { trigger: <button type="button">{trigger}</button> } : {}),
  };
  return (
    <Component {...props} {...bound} {...named}>
      {slots.content}
    </Component>
  );
}

/** A UI fixture as a consumer writes it: uncontrolled, the value as its default (REQ-322). */
export function UiFixture({ fixture }: { fixture: HarnessUiFixture }) {
  return (
    <div className={`sp-harness sp-ground-${fixture.ground}`} data-gate="" data-ui="" data-substrate={fixture.substrate} data-size={uiSizeOf(fixture)}>
      <UiComponent fixture={fixture} />
    </div>
  );
}
