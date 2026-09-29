/**
 * `@silverpoint/angular/env`: the providers, tokens and environment signals every component reads —
 * charts and UI alike. A small entry of its own, so a UI component does not carry the charts'
 * render pipeline (REQ-330); `@silverpoint/angular` re-exports it, so each token is one object.
 */
export { provideSilverpoint, SILVERPOINT_CONFIG } from './config';
export { injectForcedPrecision, injectMeasuredWidth, injectTypefaceCheck, SilverpointIds } from './environment';
export { SP_DASHBOARD_CELL, SP_DASHBOARD_LINK, type DashboardCellHandle, type DashboardLinkHandle } from './dashboard-cell';
