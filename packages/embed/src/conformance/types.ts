/** The conformance kit's shapes (Data Model §2.44, API delta §15.4). */
import type { ChartSpec } from '../spec/types';

export interface ConformanceCase {
  readonly name: string;
  readonly spec: ChartSpec;
  /** SHA-256, hex, of the UTF-8 bytes of `renderToSVG(spec).svg` with default options. */
  readonly sha256: string;
}

export interface Conformance {
  readonly version: string;
  readonly cases: readonly ConformanceCase[];
}
