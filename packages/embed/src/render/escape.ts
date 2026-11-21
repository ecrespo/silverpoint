/** Text for markup contexts (TD §6): JSON inside a script element, and text and attribute values. */

const SCRIPT_ESCAPES: Readonly<Record<string, string>> = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };

/** JSON safe inside `<script type="application/json">`: `<`, `>`, `&`, U+2028, U+2029 as `\uXXXX` (REQ-633). */
export function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => SCRIPT_ESCAPES[c] ?? c);
}

const HTML_ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export const escapeHtml = (value: string): string => value.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c);

/** A script's own text, with every `</script` broken so the element cannot close early. */
export const escapeScriptText = (code: string): string => code.replace(/<\/(script)/gi, '<\\/$1');
