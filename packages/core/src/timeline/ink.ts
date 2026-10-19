/** The frame kinds TimelineJS's pieces borrow, one hidden probe each (DD-042). */
export const TIMELINE_FRAMES = Object.freeze(['control', 'card', 'round', 'box', 'pill'] as const);
/** The tonal levels its eras and selection borrow, one hidden probe each. */
export const TIMELINE_TONES = Object.freeze(['1', '2', '3', '4'] as const);

/** A resolved style, as much of `CSSStyleDeclaration` as this reads. */
interface InkStyle {
  getPropertyValue(name: string): string;
}

interface InkView {
  getComputedStyle(element: never): InkStyle;
  readonly MutationObserver: new (callback: () => void) => {
    observe(target: never, options: { readonly attributes: boolean; readonly attributeFilter: readonly string[] }): void;
    disconnect(): void;
  };
}

/** The timeline's surface: where the `--sp-kl-*` properties are written. */
export interface TimelineInkHost {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  readonly style: { setProperty(name: string, value: string): void };
  readonly ownerDocument: { readonly defaultView: InkView | null } | null;
}

/** The hidden probe holding one `sp-frame` per kind and one `sp-tone` per level. */
export interface TimelineInkProbe {
  querySelector(selector: string): unknown;
}

/**
 * The hand on TimelineJS's own DOM (REQ-512, DD-042): reads the ground's resolved frame masks and
 * tones from the probes and republishes them on the host as `--sp-kl-*`; every mask is `none`
 * outside the `ink` mode or when `inked` is false. It re-reads when the host's ground, substrate,
 * mode or frame changes, until the returned cleanup runs. Client only.
 */
export function timelineInk(host: TimelineInkHost, probe: TimelineInkProbe, inked = true): () => void {
  const view = host.ownerDocument?.defaultView;
  if (!view) return () => {};
  const read = (selector: string, name: string, fallback: string): string => {
    const piece = probe.querySelector(selector);
    return (piece ? view.getComputedStyle(piece as never).getPropertyValue(name).trim() : '') || fallback;
  };
  const ink = () => {
    const usable = inked && host.getAttribute('data-mode') === 'ink';
    let anyMask = false;
    let anyTone = false;
    for (const kind of TIMELINE_FRAMES) {
      const piece = `[part='sp-frame'][data-kind='${kind}']`;
      const mask = usable ? read(piece, '--sp-ui-mask', 'none') : 'none';
      anyMask ||= mask !== 'none';
      host.style.setProperty(`--sp-kl-mask-${kind}`, mask);
      host.style.setProperty(`--sp-kl-mask-position-${kind}`, read(piece, '--sp-ui-mask-position', 'center'));
      host.style.setProperty(`--sp-kl-mask-size-${kind}`, read(piece, '--sp-ui-mask-size', '100% 100%'));
    }
    for (const level of TIMELINE_TONES) {
      const piece = `[part='sp-tone'][data-tone='${level}']`;
      const tone = read(piece, '--sp-ui-tone', 'none');
      anyTone ||= tone !== 'none';
      host.style.setProperty(`--sp-kl-tone-${level}`, tone);
      host.style.setProperty(`--sp-kl-tone-size-${level}`, read(piece, '--sp-ui-tone-size', 'auto'));
    }
    host.setAttribute('data-kl-inked', String(anyMask));
    host.setAttribute('data-kl-toned', String(anyTone));
  };
  ink();
  const observer = new view.MutationObserver(ink);
  observer.observe(host as never, { attributes: true, attributeFilter: ['data-mode', 'data-substrate', 'data-ground', 'data-frame', 'class'] });
  return () => observer.disconnect();
}
