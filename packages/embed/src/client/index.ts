/**
 * `@silverpoint/embed/client` (API delta §4): `mount`, `mountAll`, `<silverpoint-chart>` and
 * `hostAppearance`, framework-free, plus everything of the main entry.
 */
export * from '../index';
export { mount, type ChartMount, type MountOptions, type AppearanceDefaults } from './mount';
export { mountAll } from './mount-all';
export { defineElement, ELEMENT_NAME } from './element';
export { hostAppearance, type Appearance, type HostTheme } from './appearance';
