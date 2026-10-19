import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiAvatarGroupView, uiAvatarView, type SpAvatarProps } from '@silverpoint/core/ui';

/** `<sp-avatar>`: an image, or initials named as an image (REQ-478). */
@Component({
  selector: 'sp-avatar',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpAvatar extends SpUiBase {
  readonly src = input<string>();
  readonly name = input<string>();
  readonly initials = input<string>();
  readonly alt = input<string>();
  readonly shape = input<SpAvatarProps['shape']>();
  readonly pixelSize = input<number>();

  protected readonly view = computed(() =>
    uiAvatarView(
      { ...this.common(), src: this.src(), name: this.name(), initials: this.initials(), alt: this.alt(), shape: this.shape(), pixelSize: this.pixelSize() },
      this.resolved(),
    ),
  );
}

/** `<sp-avatar-group>`: a labelled group of the avatars it holds (REQ-478). */
@Component({
  selector: 'sp-avatar-group',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" />`,
})
export class SpAvatarGroup extends SpUiBase {
  readonly label = input<string>();

  protected readonly view = computed(() => uiAvatarGroupView({ ...this.common(), label: this.label() }, this.resolved()));
}
