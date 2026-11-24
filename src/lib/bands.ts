import type { Variant } from '../types';

// Approximate raw-score → band conversion (out of 40), based on the published IELTS guidance.
const LISTENING: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];
const READING_AC: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];
const READING_GT: [number, number][] = [
  [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5],
  [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1],
];

/** Converts a raw score to a band. Tests with fewer than 40 questions are scaled to 40. */
export function rawToBand(correct: number, total: number, skill: 'listening' | 'reading', variant: Variant): number {
  if (total <= 0) return 0;
  const scaled = Math.round((correct / total) * 40);
  const table = skill === 'listening' ? LISTENING : variant === 'general' ? READING_GT : READING_AC;
  for (const [min, band] of table) if (scaled >= min) return band;
  return 0;
}

/** Overall band: mean of the four skills rounded to the nearest half band (.25 → .5, .75 → next whole). */
export function overallBand(bands: number[]): number {
  if (!bands.length) return 0;
  const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
  return Math.round(avg * 2 + 1e-9) / 2;
}

export function fmtBand(b: number | null | undefined): string {
  if (b === null || b === undefined || Number.isNaN(b)) return '–';
  return b.toFixed(1);
}

export function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/[.,;:!?"']/g, '').replace(/\s+/g, ' ');
}
