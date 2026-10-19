import type { CommonUiProps } from '../ui/types';

/** A TimelineJS date: only `year` is required. */
export interface TimelineDate {
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
  readonly hour?: number;
  readonly minute?: number;
  readonly second?: number;
  readonly display_date?: string;
}

/** A slide's text: `text` is HTML, as TimelineJS reads it. */
export interface TimelineText {
  readonly headline?: string;
  readonly text?: string;
}

export interface TimelineSlide {
  readonly start_date: TimelineDate;
  readonly end_date?: TimelineDate;
  readonly text?: TimelineText;
  readonly unique_id?: string;
  readonly group?: string;
  readonly display_date?: string;
  readonly media?: Readonly<Record<string, unknown>>;
  readonly background?: Readonly<Record<string, unknown>>;
}

export interface TimelineEra {
  readonly start_date: TimelineDate;
  readonly end_date: TimelineDate;
  readonly text?: TimelineText;
}

/** TimelineJS's JSON (API delta §2, the timeline). */
export interface TimelineData {
  readonly title?: Omit<TimelineSlide, 'start_date'> & { readonly start_date?: TimelineDate };
  readonly events: readonly TimelineSlide[];
  readonly eras?: readonly TimelineEra[];
  readonly scale?: 'human' | 'cosmological';
}

export interface SpTimelineProps extends CommonUiProps {
  data: TimelineData;
  /** TimelineJS options; `font` and `theme` are ignored, the skin sets both. */
  options?: Readonly<Record<string, unknown>>;
  /** A plain CSS length. Default `'600px'`. */
  height?: string;
  /** Lays the ground's frames and tones on TimelineJS's pieces (REQ-512). Default `true`. */
  inkedFrames?: boolean;
  /** Frames the whole timeline as a card. Default `true`. */
  card?: boolean;
  /** The region's accessible name; the title's headline when omitted. */
  label?: string;
}
