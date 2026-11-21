/** The script build's entry: every export on `globalThis.Silverpoint`, the element defined on load. */
import * as embed from './embed';
export * from './embed';
if (typeof window !== 'undefined') embed.defineElement();
