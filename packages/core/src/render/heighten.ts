import { diagnose } from '../diagnostics/diagnose';
import type { Geometry, Stroke } from '../types';

function isOutlineOf(candidate: Stroke, heightened: Stroke): boolean {
  return (
    candidate.part === 'ink' &&
    (candidate.paint ?? 'stroke') === 'stroke' &&
    candidate.d === heightened.d
  );
}

/**
 * Holds the heightening rules on a geometry:
 * - a single heightened element per chart (REQ-024); a second one throws SP005 in development
 *   and is dropped in production (REQ-025);
 * - every heightened element carries an outline in the main ink (REQ-031), which is added
 *   when the recipe did not draw it.
 */
export function enforceHeightening(geometry: Geometry, chart: string): Geometry {
  const heightened = geometry.strokes.filter((stroke) => stroke.part === 'heighten');
  if (heightened.length === 0) return geometry;
  if (heightened.length > 1 && process.env.NODE_ENV !== 'production') {
    diagnose('SP005', chart, {
      property: 'heighten',
      message: `${heightened.length} heightened elements were declared.`,
    });
  }
  const [kept] = heightened as [Stroke, ...Stroke[]];
  const strokes: Stroke[] = [];
  for (const stroke of geometry.strokes) {
    if (stroke.part === 'heighten' && stroke !== kept) continue;
    strokes.push(stroke);
    if (stroke === kept && !geometry.strokes.some((other) => isOutlineOf(other, kept))) {
      strokes.push({ d: kept.d, role: kept.role, part: 'ink', paint: 'stroke' });
    }
  }
  return { ...geometry, strokes };
}
