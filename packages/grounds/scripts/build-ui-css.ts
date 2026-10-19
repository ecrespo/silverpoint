/** Writes dist/ui.css and dist/timeline.css from the built-in grounds (REQ-301, DD-022). Run by `pnpm build`, after tsup. */
import { writeFileSync } from 'node:fs';
import { cyanotype, silverpoint } from '../src';
import { buildTimelineCss } from '../src/timeline/timeline-css';
import { buildUiCss } from '../src/ui/ui-css';

writeFileSync(new URL('../dist/ui.css', import.meta.url), buildUiCss([silverpoint, cyanotype]));
writeFileSync(new URL('../dist/timeline.css', import.meta.url), buildTimelineCss());
