/** Writes dist/styles-text.js and its types from dist/styles.css (#19). Run by `pnpm build`, after the stylesheet is written. */
import { readFileSync, writeFileSync } from 'node:fs';
import { stylesTextModule } from './styles-text';

const { js, dts } = stylesTextModule(readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8'));
writeFileSync(new URL('../dist/styles-text.js', import.meta.url), js);
writeFileSync(new URL('../dist/styles-text.d.ts', import.meta.url), dts);
