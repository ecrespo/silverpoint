import type { TimelineData, TimelineSlide } from '../timeline/types';
import { deepFreeze } from './demo';

const event = (year: number, headline: string, text: string, id: string): TimelineSlide => ({
  start_date: { year },
  text: { headline, text: `<p>${text}</p>` },
  unique_id: id,
});

/**
 * The timeline page's data (Data Model delta §4): the life of a silverpoint drawing in TimelineJS
 * JSON, eight events and two eras, no external media. Deep-frozen (I-9).
 */
export const TIMELINE_DEMO: TimelineData = /* @__PURE__ */ deepFreeze({
  title: {
    text: {
      headline: 'Silverpoint',
      text: '<p>Drawing with a silver stylus on a prepared ground: a line that cannot be erased, tone built from hatching, white heightening on the light.</p>',
    },
    unique_id: 'title',
  },
  eras: [
    { start_date: { year: 1390 }, end_date: { year: 1500 }, text: { headline: 'Workshop manuals' } },
    { start_date: { year: 1500 }, end_date: { year: 1600 }, text: { headline: 'Renaissance studies' } },
  ],
  events: [
    event(1400, "Cennini's handbook", "Il libro dell'arte describes how to prepare a ground with bone ash.", 'cennini'),
    event(1435, 'Van Eyck', 'Portrait of Cardinal Albergati, a silverpoint study for the painting.', 'van-eyck'),
    event(1440, 'Pisanello', 'Studies from life, a metal stylus on tinted paper.', 'pisanello'),
    event(1478, 'Leonardo', 'Head studies in metalpoint on tinted grounds.', 'leonardo'),
    event(1484, 'Dürer at thirteen', 'Self-portrait in silverpoint: no correction is possible.', 'durer'),
    event(1503, 'Raphael', 'Studies for the Madonnas, heightened with white.', 'raphael'),
    event(1527, 'Holbein', 'Portrait studies at the English court, metalpoint and chalk.', 'holbein'),
    event(1565, 'Graphite', 'Borrowdale graphite reaches the workshops; metalpoint fades.', 'graphite'),
  ],
});
