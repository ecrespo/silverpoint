/**
 * The capturing sink around a build (DD-048, OQ-E5): the core's warnings go to a collector
 * instead of the console, and its error codes are caught, for exactly one synchronous call.
 * `__setDiagnosticSink` is internal to the core; this package ships in its fixed group, so it
 * always runs against the core it was tested with.
 */
import { __setDiagnosticSink, SilverpointError, type SpCode } from '@silverpoint/core';
import type { Catalog } from './catalog';

export interface ReportedDiagnostic {
  readonly code: string;
  readonly severity: 'warn' | 'error';
  readonly req: string;
  readonly message: string;
  readonly todo: string;
}

export interface Captured<T> {
  readonly value?: T;
  readonly diagnostics: ReportedDiagnostic[];
  /** Set when an `error` code was raised: the build has no value. */
  readonly failed: boolean;
}

function reported(catalog: Catalog, code: SpCode | string, message: string): ReportedDiagnostic {
  const known = catalog.data.diagnostics.find((d) => d.code === code);
  return { code, severity: known?.severity ?? 'warn', req: known?.req ?? '', message, todo: known?.todo ?? '' };
}

export function capturing<T>(catalog: Catalog, run: () => T): Captured<T> {
  const diagnostics: ReportedDiagnostic[] = [];
  // The core strips its warnings where NODE_ENV is `production`, as a deployment sets it; the
  // read is at call time in the published build, so the call runs as development (REQ-542).
  const environment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const restore = __setDiagnosticSink((code, message) => diagnostics.push(reported(catalog, code, message)));
  try {
    return { value: run(), diagnostics, failed: false };
  } catch (error) {
    if (!(error instanceof SilverpointError)) throw error;
    diagnostics.push(reported(catalog, error.code, error.message));
    return { diagnostics, failed: true };
  } finally {
    restore();
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
  }
}
