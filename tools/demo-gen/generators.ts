/**
 * The synthetic datasets of the second catalog's demos (REQ-446, Data Model delta §4): original,
 * generated from fixed seeds by the core's own PRNG, with arithmetic only, so a regeneration on
 * any machine prints the same literals. Nothing here runs at render time: the output is committed.
 */
import { createPrng } from '@silverpoint/core';

export type Row = Record<string, string | number | null>;

/** Rounds to `digits` decimals; the literal printed is the shortest that reads back the same. */
export const round = (value: number, digits: number) => {
  let scale = 1;
  for (let i = 0; i < digits; i += 1) scale *= 10;
  return Math.round(value * scale) / scale;
};
const pad = (n: number, width: number) => String(n).padStart(width, '0');

/** A standard normal by the Irwin–Hall sum of twelve uniforms: no `Math.log`, no `Math.exp`. */
function normal(random: () => number): number {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += random();
  return sum - 6;
}
const int = (random: () => number, lo: number, hi: number) => lo + Math.floor(random() * (hi - lo + 1));
/** `x²` by multiplication: the exponent operator is implementation-approximated. */
const square = (x: number) => x * x;

/** Shares `total` over weights by the largest remainder, so the parts sum exactly. */
function largestRemainder(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const parts = exact.map(Math.floor);
  const order = exact.map((e, i) => [e - Math.floor(e), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; k < total - parts.reduce((s, p) => s + p, 0); k += 1) {
    const i = order[k]?.[1] as number;
    parts[i] = (parts[i] as number) + 1;
  }
  return parts;
}

/** Histogram, ECDF, beeswarm: 240 right-skewed reading times, rounded to half minutes (ties). */
export function readingTimes(): Row[] {
  const random = createPrng(400);
  return Array.from({ length: 240 }, (_, i) => {
    const device = random() < 0.6 ? 'phone' : 'desktop';
    const chi = square(normal(random)) + square(normal(random)) + square(normal(random));
    const minutes = round((1 + 2.2 * chi * (device === 'phone' ? 0.8 : 1.1)) * 2, 0) / 2;
    return { reader: `R${pad(i + 1, 3)}`, device, minutes };
  });
}

/** Box plot, violin, ridgeline: response times of five services, 24 to 60 each. */
export function serviceTimes(): Row[] {
  const random = createPrng(402);
  const rows: Row[] = [];
  const add = (service: string, n: number, draw: (i: number) => number) => {
    for (let i = 0; i < n; i += 1) rows.push({ service, ms: Math.round(draw(i)) });
  };
  add('Search', 60, () => 180 + 25 * normal(random));
  add('Checkout', 60, (i) => (i % 2 === 0 ? 140 + 15 * normal(random) : 260 + 20 * normal(random)));
  add('Profile', 48, (i) => (i % 12 === 5 ? 220 + 80 * random() : 120 + 12 * normal(random)));
  add('Reports', 36, () => 300 + 25 * (square(normal(random)) + square(normal(random))));
  add('Login', 24, () => 90 + 8 * normal(random));
  return rows;
}

/** Lollipop: loans at 12 library branches, some with long names, unsorted. */
export function branchLoans(): Row[] {
  const random = createPrng(406);
  const branches = [
    'Northgate', 'Riverside Commons', 'Old Mill', 'Harbour View Annex', 'Elm Street', 'Quarry Hill',
    'Saint Brigid Reading Rooms', 'Westfield', 'Lantern Square', 'Copper Beech', 'Marsh Lane',
    'Upper Fenwick Community Library',
  ];
  return branches.map((branch) => ({ branch, loans: int(random, 1200, 9800) }));
}

/** Dumbbell, slopegraph: average wait at 10 clinics in two years; two of them improve. */
export function clinicWaits(): Row[] {
  const random = createPrng(407);
  const clinics = ['Ashford', 'Brook Lane', 'Castlegate', 'Dunmore', 'Eastwick', 'Fairholm', 'Glenbrook', 'Hollins', 'Ivybridge', 'Juniper Row'];
  return clinics.map((clinic, i) => {
    const y2024 = int(random, 20, 60);
    const change = i === 3 || i === 7 ? -int(random, 4, 12) : int(random, 3, 15);
    return { clinic, y2024, y2025: y2024 + change };
  });
}

/** Bump: six teams' points over eight seasons, all distinct but one tie. */
export function seasonPoints(): Row[] {
  const random = createPrng(409);
  const teams = ['Kestrel', 'Otter', 'Lynx', 'Heron', 'Badger', 'Marten'];
  const strength = teams.map(() => int(random, 35, 70));
  const rows: Row[] = [];
  for (let s = 0; s < 8; s += 1) {
    const used = new Set<number>();
    const points = teams.map((_, t) => {
      strength[t] = (strength[t] as number) + int(random, -8, 8);
      let v = strength[t] as number;
      while (used.has(v)) v += 1;
      used.add(v);
      return v;
    });
    // The one tie: Otter draws level with Kestrel in the fourth season.
    if (s === 3) points[1] = points[0] as number;
    teams.forEach((team, t) => rows.push({ season: 2018 + s, team, points: points[t] as number }));
  }
  return rows;
}

/** Error bars: eight effect estimates with asymmetric intervals around 0. */
export function effects(): Row[] {
  const random = createPrng(410);
  return 'ABCDEFGH'.split('').map((letter) => {
    const effect = round(-1.2 + 3.6 * random(), 2);
    return { arm: `Arm ${letter}`, effect, low: round(effect - (0.3 + 1.2 * random()), 2), high: round(effect + (0.3 + 1.8 * random()), 2) };
  });
}

/** Interval: four crews' jobs over the first quarter of 2026, ISO dates. */
export function crewJobs(): Row[] {
  const random = createPrng(411);
  const crews = ['North crew', 'South crew', 'Bridge team', 'Survey'];
  const tasks = ['Grading', 'Drainage', 'Formwork', 'Paving', 'Inspection', 'Lighting', 'Signage', 'Fencing'];
  const day = (n: number) => {
    const lengths = [31, 28, 31];
    let month = 0;
    let rest = n;
    while (rest >= (lengths[month] as number)) {
      rest -= lengths[month] as number;
      month += 1;
    }
    return `2026-${pad(month + 1, 2)}-${pad(rest + 1, 2)}`;
  };
  const rows: Row[] = [];
  for (const crew of crews) {
    const count = int(random, 3, 5);
    for (let k = 0; k < count; k += 1) {
      const start = int(random, 0, 80);
      const end = Math.min(start + int(random, 4, 24), 89);
      rows.push({ crew, task: tasks[int(random, 0, tasks.length - 1)] as string, from: day(start), to: day(end) });
    }
  }
  return rows;
}

export const LIKERT_LEVELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'] as const;

/** Diverging bars: 200 answers to each of six questions, on a five-level scale. */
export function survey(): Row[] {
  const random = createPrng(412);
  const questions = ['The site is easy to use', 'Prices are fair', 'Delivery was on time', 'Support solved my issue', 'I would recommend it', 'The app is reliable'];
  return questions.map((question) => {
    const lean = random();
    const weights = LIKERT_LEVELS.map((_, i) => 0.3 + random() + (i >= 3 ? lean : 1 - lean));
    const counts = largestRemainder(weights, 200);
    return Object.fromEntries([['question', question], ...LIKERT_LEVELS.map((level, i) => [level, counts[i] as number])]) as Row;
  });
}

/** Connected scatter: fare and riders over 14 years, with one loop that crosses the path. */
export function fareRiders(): Row[] {
  const random = createPrng(413);
  const loop: Record<number, readonly [number, number]> = { 6: [0.5, 4], 7: [0.1, 8], 8: [-0.6, 4], 9: [-0.3, -5] };
  return Array.from({ length: 14 }, (_, t) => {
    const [dx, dy] = loop[t] ?? [0, 0];
    return {
      year: 2012 + t,
      fare: round(1.5 + 0.12 * t + dx + 0.04 * (random() - 0.5), 2),
      riders: round(40 + 1.5 * t + dy + 0.6 * (random() - 0.5), 1),
    };
  });
}

/** Waffle: household energy use, 1 000 kWh in five uses, whose tenths leave remainders. */
export function energyUse(): Row[] {
  return [
    { use: 'Heating', kwh: 412 },
    { use: 'Water heating', kwh: 263 },
    { use: 'Appliances', kwh: 158 },
    { use: 'Lighting', kwh: 97 },
    { use: 'Cooking', kwh: 70 },
  ];
}

/** Marimekko: sales by region and channel, columns of unequal totals. */
export function regionSales(): Row[] {
  const random = createPrng(415);
  const rows: Row[] = [];
  for (const [r, region] of ['North', 'South', 'East', 'West'].entries()) {
    for (const channel of ['Retail', 'Online', 'Wholesale', 'Direct']) rows.push({ region, channel, sales: int(random, 20, 120 + 90 * r) });
  }
  return rows;
}

/**
 * Treemap, sunburst, tree: a fictional city budget — a root, 5 departments, 16 programmes and 16
 * budget lines under 8 of them; values on the leaves only (Data Model §2.23).
 */
export function cityBudget(): Row[] {
  const random = createPrng(416);
  const departments: readonly [string, string, readonly string[]][] = [
    ['works', 'Public works', ['Roads', 'Bridges', 'Water mains', 'Street lighting']],
    ['parks', 'Parks', ['Playgrounds', 'Tree care', 'Sports fields']],
    ['safety', 'Safety', ['Fire service', 'Lifeguards', 'Emergency planning']],
    ['culture', 'Culture', ['Libraries', 'Museum', 'Festivals']],
    ['admin', 'Administration', ['Payroll', 'Records', 'IT services']],
  ];
  const rows: Row[] = [{ id: 'budget', parent: null, name: 'City budget' }];
  let programme = 0;
  for (const [id, name, programmes] of departments) {
    rows.push({ id, parent: 'budget', name });
    for (const title of programmes) {
      const pid = `${id}-${pad(programme + 1, 2)}`;
      if (programme % 2 === 0) {
        rows.push({ id: pid, parent: id, name: title });
        rows.push({ id: `${pid}-a`, parent: pid, name: `${title}: staff`, amount: int(random, 200, 4000) });
        rows.push({ id: `${pid}-b`, parent: pid, name: `${title}: materials`, amount: int(random, 100, 3000) });
      } else {
        rows.push({ id: pid, parent: id, name: title, amount: int(random, 300, 9000) });
      }
      programme += 1;
    }
  }
  return rows;
}

export const BIKE_DIMENSIONS = ['mass', 'gears', 'price', 'range', 'rating'] as const;

/** Parallel coordinates: 30 bicycles on five dimensions of very different scales. */
export function bicycles(): Row[] {
  const random = createPrng(419);
  return Array.from({ length: 30 }, (_, i) => ({
    model: `Model ${pad(i + 1, 2)}`,
    mass: round(8 + 16 * random(), 1),
    gears: int(random, 1, 24),
    price: int(random, 300, 4200),
    range: int(random, 20, 140),
    rating: round(1 + 4 * random(), 1),
  }));
}

/** Polar line: rainfall by month, `period: 12`. */
export function monthlyRain(): Row[] {
  const random = createPrng(420);
  const seasonal = [78, 61, 55, 47, 52, 41, 30, 35, 49, 72, 88, 91];
  return seasonal.map((mm, month) => ({ month, rain: Math.round(mm + 10 * (random() - 0.5)) }));
}

/** Polar scatter: 150 sightings by bearing and distance, one cluster across north. */
export function sightings(): Row[] {
  const random = createPrng(421);
  const centres = [5, 130, 250];
  return Array.from({ length: 150 }, (_, i) => {
    const raw = (centres[i % 3] as number) + 18 * normal(random);
    return { bearing: round(((raw % 360) + 360) % 360, 1), distance: round(0.5 + 3 * (square(normal(random)) + random()), 1) };
  });
}

/** Density bins, contours: 1 200 points from two overlapping clusters. */
export function twoClusters(): Row[] {
  const random = createPrng(422);
  return Array.from({ length: 1200 }, (_, i) => {
    const a = i < 700;
    const u = normal(random);
    const v = normal(random);
    return a
      ? { x: round(35 + 9 * u, 2), y: round(60 + 7 * u + 9 * v, 2) }
      : { x: round(62 + 10 * u, 2), y: round(38 - 4 * u + 8 * v, 2) };
  });
}

/** Contours (grid): a smooth surface of two hills and a pit on a 40 × 30 grid, rational bumps only. */
export function surface(): Row[] {
  const bump = (x: number, y: number, cx: number, cy: number, spread: number) => 1 / (1 + ((x - cx) * (x - cx) + (y - cy) * (y - cy)) / spread);
  const rows: Row[] = [];
  for (let y = 0; y < 30; y += 1) {
    for (let x = 0; x < 40; x += 1) {
      rows.push({ x, y, value: round(6 * bump(x, y, 12, 10, 40) + 4 * bump(x, y, 28, 20, 60) - 2.5 * bump(x, y, 30, 6, 15), 3) });
    }
  }
  return rows;
}

/** Delaunay: 60 distinct labelled points. */
export function scatterPoints(): Row[] {
  const random = createPrng(424);
  const seen = new Set<string>();
  const rows: Row[] = [];
  while (rows.length < 60) {
    const x = round(100 * random(), 1);
    const y = round(60 * random(), 1);
    if (seen.has(`${x},${y}`)) continue;
    seen.add(`${x},${y}`);
    rows.push({ label: `P${pad(rows.length + 1, 2)}`, x, y });
  }
  return rows;
}

/** Vector field: a vortex on a 20 × 14 grid, its speed falling off with distance. */
export function vortex(): Row[] {
  const rows: Row[] = [];
  for (let y = 0; y < 14; y += 1) {
    for (let x = 0; x < 20; x += 1) {
      const dx = x - 9.5;
      const dy = y - 6.5;
      const falloff = 1 + (dx * dx + dy * dy) / 20;
      rows.push({ x, y, u: round(-dy / falloff, 3), v: round(dx / falloff, 3) });
    }
  }
  return rows;
}

export const NETWORK_GROUPS = ['Archive', 'Studio', 'Lab', 'Press'] as const;

/** Network: 40 people in four teams and 90 links, most within a team. */
export function network(): { nodes: Row[]; links: Row[] } {
  const random = createPrng(426);
  const nodes: Row[] = NETWORK_GROUPS.flatMap((group) =>
    Array.from({ length: 10 }, (_, k) => ({ id: `${group.slice(0, 1).toLowerCase()}${pad(k + 1, 2)}`, label: `${group} ${k + 1}`, group })),
  );
  const pairs = new Set<string>();
  const links: Row[] = [];
  while (links.length < 90) {
    const g = int(random, 0, 3);
    const h = random() < 0.8 ? g : int(random, 0, 3);
    const source = nodes[g * 10 + int(random, 0, 9)]?.id as string;
    const target = nodes[h * 10 + int(random, 0, 9)]?.id as string;
    const pair = [source, target].sort().join('|');
    if (source === target || pairs.has(pair)) continue;
    pairs.add(pair);
    links.push({ source, target, weight: int(random, 1, 5) });
  }
  return { nodes, links };
}
