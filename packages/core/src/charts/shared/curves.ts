import { curveLinear, curveMonotoneX, curveNatural, curveStepAfter, type CurveFactory } from 'd3-shape';
import type { LineCurve } from '../../types';

/** The curves a line or an area may take (API Spec §5.1: `monotone` by default). */
export const CURVES: Readonly<Record<LineCurve, CurveFactory>> = {
  monotone: curveMonotoneX,
  linear: curveLinear,
  natural: curveNatural,
  step: curveStepAfter,
};
