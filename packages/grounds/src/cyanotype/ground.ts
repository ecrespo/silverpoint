import type { Ground } from '@silverpoint/core';
import { deepFreeze } from '../freeze';
import { silverpoint } from '../silverpoint/ground';

/**
 * The `cyanotype` ground: a white line on Prussian blue (Data Model §3.7). Its tonal mechanism is
 * line weight (REQ-028): a toned shape is drawn as its own outline, and the tone is its thickness,
 * so nothing is hatched (TD DD-019). Every value is data (Art. 7).
 *
 * The palette is computed against the one substrate, not chosen by eye (REQ-126, REQ-127). On a
 * dark ground white is the ink, so the heightened element is the deepest blue, a reserve, and its
 * outline in `primary` carries the contrast (REQ-031).
 */
export const cyanotype: Ground = deepFreeze({
  name: 'cyanotype',
  tonalMechanism: 'weight',
  inker: 'weight',
  substrates: {
    prussian: '#1B3F6B',
  },
  ink: {
    primary: '#E2EAF2',
    secondary: '#DCCBA8',
    heighten: '#0C2240',
    rule: '#8AA8C7',
    grid: '#8AA8C7',
    text: '#F4F6F8',
    textMuted: '#B8CBDE',
  },
  // A contact print's line is exact: nothing is redrawn by hand, and there is no hatch to set.
  inkOptions: {
    roughness: 0,
    bowing: 0,
    hatchAngle: 0,
    hatchGap: 0,
    fillWeight: 0,
  },
  maxHatchDensity: 0,
  tonalRamp: {
    1: { style: 'weight', weight: 1.5 },
    2: { style: 'weight', weight: 2.25 },
    3: { style: 'weight', weight: 3 },
    4: { style: 'weight', weight: 4 },
  },
  typography: silverpoint.typography,
  emptyState: silverpoint.emptyState,
  domainPadding: silverpoint.domainPadding,
});
