/**
 * Writes the site's generated data: the props reference. Run after changing the public types:
 *   pnpm --filter @silverpoint/docs generate
 */
import { writeFileSync } from 'node:fs';
import { propsReference } from './props';

const out = (name: string) => new URL(`../generated/${name}`, import.meta.url);
writeFileSync(out('props.json'), `${JSON.stringify(propsReference(), null, 2)}\n`);
console.log('wrote generated/props.json');
