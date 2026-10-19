/** `--a:1;b:2` as React's style object; custom properties keep their names. */
export function styleObject(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const declaration of value.split(';')) {
    const at = declaration.indexOf(':');
    if (at > 0) out[declaration.slice(0, at).trim()] = declaration.slice(at + 1).trim();
  }
  return out;
}
