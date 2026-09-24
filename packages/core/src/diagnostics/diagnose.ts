/** Stable diagnostic codes, part of the public surface (API Spec §11). */
export type SpCode =
  | 'SP001'
  | 'SP002'
  | 'SP003'
  | 'SP004'
  | 'SP005'
  | 'SP006'
  | 'SP007'
  | 'SP008'
  | 'SP009'
  | 'SP010'
  | 'SP011'
  | 'SP012'
  | 'SP013';

export interface Detail {
  /** The property involved. */
  readonly property: string;
  /** Specifics of this occurrence, appended to what happened. */
  readonly message?: string;
}

interface Template {
  readonly req: string;
  readonly what: string;
  readonly todo: string;
}

/** Thrown by diagnostics of `error` severity. */
export class SilverpointError extends Error {
  readonly code: SpCode;

  constructor(code: SpCode, message: string) {
    super(message);
    this.name = 'SilverpointError';
    this.code = code;
  }
}

/** Receives every warning; replaceable so tests and tools can observe diagnostics. */
export type DiagnosticSink = (code: SpCode, message: string) => void;

const consoleSink: DiagnosticSink = (_code, message) => {
  console.warn(message);
};

let sink: DiagnosticSink = consoleSink;
const reported = new Set<string>();

/**
 * Replaces the warning sink and forgets already reported warnings. Returns a function that
 * restores the console sink.
 * @internal
 */
export function __setDiagnosticSink(next: DiagnosticSink | null): () => void {
  sink = next ?? consoleSink;
  reported.clear();
  return () => {
    sink = consoleSink;
    reported.clear();
  };
}

function format(code: SpCode, chart: string, detail: Detail, template: Template): string {
  const specifics = detail.message ? ` ${detail.message}` : '';
  return `[${code}] ${chart}: ${template.what} (\`${detail.property}\`).${specifics} ${template.todo}. (${template.req})`;
}

/** Always shipped: these diagnostics throw in every build (TD §5.4). */
const ERRORS: Partial<Record<SpCode, Template>> = {
  SP009: {
    req: 'REQ-097',
    what: 'a scale bound cannot be derived from the data and was not supplied',
    todo: 'Pass the named property explicitly',
  },
  SP012: {
    req: 'REQ-127',
    what: 'the ground does not reach the minimum contrast',
    todo: 'Recompute the palette; colours are not chosen by eye',
  },
};

/**
 * The single diagnostic channel (TD §5.4). `error` codes always throw; `warn` codes reach
 * the sink only outside production and are stripped from production bundles.
 */
export function diagnose(code: SpCode, chart: string, detail: Detail): void {
  const error = ERRORS[code];
  if (error) {
    throw new SilverpointError(code, format(code, chart, detail, error));
  }
  if (process.env.NODE_ENV !== 'production') {
    developmentDiagnose(code, chart, detail);
  }
}

function developmentDiagnose(code: SpCode, chart: string, detail: Detail): void {
  const template = WARNINGS[code];
  if (!template) return;
  const message = format(code, chart, detail, template);
  // SP005 is an error in development and a stripped warning in production (REQ-025).
  if (code === 'SP005') {
    throw new SilverpointError(code, message);
  }
  if (reported.has(message)) return;
  reported.add(message);
  sink(code, message);
}

const WARNINGS: Partial<Record<SpCode, Template>> = {
  SP001: {
    req: 'REQ-007',
    what: 'the dataset is empty; the ground\'s empty state is drawn',
    todo: 'Pass at least one row, or omit `data` to see the demo dataset',
  },
  SP002: {
    req: 'REQ-008',
    what: 'a value is null, undefined or not finite; the point is omitted from the stroke',
    todo: 'Clean the value, or set `connectNulls` to bridge the gap',
  },
  SP003: {
    req: 'REQ-009',
    what: 'the container measures 0 px; the render is deferred',
    todo: 'Give the container a size, or pin `width` and `height`',
  },
  SP004: {
    req: 'REQ-010',
    what: 'the scale domain has zero length; it is expanded with the ground\'s domainPadding',
    todo: 'Nothing to do if the data is constant; otherwise check the accessor',
  },
  SP005: {
    req: 'REQ-025',
    what: 'more than one element is marked with white heightening; only the first is applied',
    todo: 'Heighten a single element per chart',
  },
  SP006: {
    req: 'REQ-026',
    what: 'the inker is not registered; falling back to NullInker',
    todo: 'Register the inker or fix the ground\'s `inker` token',
  },
  SP007: {
    req: 'REQ-045',
    what: 'the ground is not registered; falling back to silverpoint',
    todo: 'Call registerGround() before rendering, or fix the name',
  },
  SP008: {
    req: 'REQ-096',
    what: 'the data volume is above the family\'s threshold',
    todo: 'Aggregate the data before charting it',
  },
  SP010: {
    req: 'REQ-091',
    what: 'the chord ring has more than 12 categories',
    todo: 'Group the smaller categories',
  },
  SP011: {
    req: 'NFR §7',
    what: 'the path byte budget of 40 KB is exceeded',
    todo: "Use `hatchFill: 'tile'` or a larger hatch gap",
  },
  SP013: {
    req: 'REQ-032',
    what: 'the @silverpoint/fonts face failed to load; rendering fell back to the system stack',
    todo: 'Install @silverpoint/fonts and import its stylesheet; golden images will not match until then',
  },
};
