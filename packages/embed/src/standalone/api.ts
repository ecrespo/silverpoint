/**
 * What `globalThis.Silverpoint` holds (REQ-649): the main entry, the client, `specFromTable` and
 * `hostCatalogFollows`, and the `conformance` function — with no import left, and the renderers
 * bound to the face the build carries. Importing the module build touches no DOM global, so Node
 * can call the DOM-free functions from it. `HOST_CATALOG` is a file hosts pin, not in the script.
 */
import { embeddedRegularFace } from '../client/fonts';
import { createRenderToHTML } from '../render/html';
import { createRenderToSVG } from '../render/svg';
import { VERSION } from '../render/assets.generated';

export * from '../api';
export { mount, type ChartMount, type MountOptions, type AppearanceDefaults } from '../client/mount';
export { mountAll } from '../client/mount-all';
export { defineElement, ELEMENT_NAME } from '../client/element';
export { hostAppearance } from '../client/appearance';
export { specFromTable } from '../hosts/spec-from-table';
export { hostCatalogFollows } from '../hosts/follows';
export type { Table, TableBinding } from '../hosts/types';
export { conformance } from '../conformance/conformance';

/** `Silverpoint.version` (REQ-651). */
export const version: string = VERSION;
export const renderToSVG = /* @__PURE__ */ createRenderToSVG(embeddedRegularFace);
export const renderToHTML = /* @__PURE__ */ createRenderToHTML(embeddedRegularFace);
