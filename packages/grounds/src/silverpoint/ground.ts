import type { Ground } from '@silverpoint/core';
import { deepFreeze } from '../freeze';

/**
 * The `silverpoint` ground: Renaissance silverpoint over a prepared mid-tone substrate
 * (Data Model §3). Every value is data; no chart reads it except through this object (Art. 7).
 *
 * The palette is computed, not chosen by eye: changing a colour requires recomputing its
 * contrast, which `tools/contrast-gate` enforces (REQ-126, REQ-127).
 */
export const silverpoint: Ground = deepFreeze({
  name: 'silverpoint',
  tonalMechanism: 'hatch',
  inker: 'rough',
  substrates: {
    cream: '#EDE7DA',
    green: '#D8DCD0',
    blue: '#D2D8DF',
    ochre: '#E7DABC',
  },
  ink: {
    primary: '#5A5E65',
    secondary: '#685C4D',
    heighten: '#FFFFFF',
    rule: '#737A82',
    grid: '#737A82',
    text: '#3F4348',
    // No softer grey meets 4.5:1 over a light substrate; hierarchy comes from type (§3.2).
    textMuted: '#5A5E65',
  },
  inkOptions: {
    roughness: 0.45,
    bowing: 0.6,
    hatchAngle: -41,
    hatchGap: 7,
    fillWeight: 0.55,
  },
  maxHatchDensity: 4,
  tonalRamp: {
    1: { style: 'hachure', gap: 10, angle: -41 },
    2: { style: 'hachure', gap: 7.5, angle: -41 },
    3: { style: 'hachure', gap: 5.5, angle: -41 },
    4: { style: 'cross-hatch', gap: 5.5, angle: -41 },
  },
  typography: {
    display: "'EB Garamond', 'Iowan Old Style', Georgia, serif",
    scale: 1,
  },
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
});
