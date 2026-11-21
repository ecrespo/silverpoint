/**
 * The embed's own diagnostics (API delta §6): `SP030` (a spec over its limits, REQ-635) and `SP031`
 * (an invalid spec given to the client, REQ-668), both of error severity. Worded in the core's
 * format (TD §5.4), but templated here so the core's production bundle carries none of them
 * (REQ-444, REQ-652); the agent catalog reads this table beside the core's.
 */
import type { EmbedDiagnostic } from './types';

interface Template {
  readonly req: string;
  readonly what: string;
  readonly todo: string;
}

export const EMBED_ERRORS: Readonly<Record<'SP030' | 'SP031', Template>> = {
  SP030: {
    req: 'REQ-635',
    what: 'a spec exceeds 2 MB serialised, or its path data exceeds the path byte budget; it is refused',
    todo: "Send fewer rows, aggregate before charting, or use `hatchFill: 'tile'`",
  },
  SP031: {
    req: 'REQ-668',
    what: 'the embed client was given a spec that does not validate; the error figure is shown',
    todo: 'Read the message: it names the field, the unknown chart with suggestions, or the undeclared props',
  },
};

/** `[SPnnn] chart: what (`property`). specifics todo. (REQ-nnn)`, as the core writes its own. */
export function errorDiagnostic(code: 'SP030' | 'SP031', chart: string, property: string, message: string): EmbedDiagnostic {
  const t = EMBED_ERRORS[code];
  return { code, severity: 'error', message: `[${code}] ${chart}: ${t.what} (\`${property}\`). ${message} ${t.todo}. (${t.req})` };
}
