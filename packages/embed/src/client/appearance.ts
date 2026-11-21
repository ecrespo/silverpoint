/**
 * `hostAppearance` (REQ-648, DD-071): a host's theme selects among the **declared** grounds and
 * substrates by the distance of relative luminance; high contrast selects `precision`. It returns
 * names and computes no colour of its own: palettes stay computed and contrast-checked.
 */
import { listGrounds } from '@silverpoint/grounds';

export interface HostTheme {
  readonly background: string;
  readonly foreground?: string;
  readonly highContrast?: boolean;
}

export interface Appearance {
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
}

const DEFAULT = { ground: 'silverpoint', substrate: 'cream' } as const;

function channels(colour: string): [number, number, number] | undefined {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim());
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map((c) => c + c).join('') : hex[1]!;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/i.exec(colour.trim());
  return rgb ? ([rgb[1], rgb[2], rgb[3]].map(Number) as [number, number, number]) : undefined;
}

/** WCAG relative luminance of an sRGB colour. */
function luminance([r, g, b]: [number, number, number]): number {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function hostAppearance(host: HostTheme): Appearance {
  const mode = host.highContrast ? 'precision' : 'ink';
  const background = channels(host.background);
  if (!background) return { ...DEFAULT, mode };
  const target = luminance(background);
  let best: { ground: string; substrate: string; distance: number } | undefined;
  for (const ground of listGrounds()) {
    for (const [substrate, colour] of Object.entries(ground.substrates)) {
      const c = channels(colour);
      if (!c) continue;
      const distance = Math.abs(luminance(c) - target);
      if (!best || distance < best.distance) best = { ground: ground.name, substrate, distance };
    }
  }
  return best ? { ground: best.ground, substrate: best.substrate, mode } : { ...DEFAULT, mode };
}
