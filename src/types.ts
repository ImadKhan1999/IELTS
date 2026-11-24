export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';
export type Variant = 'academic' | 'general';

export interface Option {
  key: string; // "A", "B", "i", "TRUE" ...
  text: string;
}

/**
 * Question types:
 * - gap:   free-text answer (sentence / note / table / form / summary completion, short answer)
 * - mcq:   choose one option (per-question options)
 * - multi: choose N options from a shared list; each correct pick scores one mark
 * - tfng:  TRUE / FALSE / NOT GIVEN
 * - ynng:  YES / NO / NOT GIVEN
 * - match: choose one option from a shared list (headings, features, endings, map labels)
 */
export type QuestionType = 'gap' | 'mcq' | 'multi' | 'tfng' | 'ynng' | 'match';

export interface Question {
  number: number;
  prompt?: string; // for gap type, "___" marks where the input goes
  options?: Option[]; // mcq only
  answer: string[]; // accepted answers (case-insensitive). For multi, one key per question.
  explanation?: string;
  evidence?: string; // exact substring of the passage/transcript that justifies the answer
}

export interface QuestionGroup {
  id: string;
  type: QuestionType;
  instructions: string;
  title?: string;
  options?: Option[]; // shared list for match / multi
  questions: Question[];
}

export interface Section {
  id: string;
  title: string; // "Part 1" / "Passage 1"
  passageTitle?: string;
  passage?: string; // reading: paragraphs separated by blank lines
  transcript?: string; // listening: "Speaker: line" per line
  audio?: string; // URL or "idb:<key>" for an uploaded file
  groups: QuestionGroup[];
}

export interface ObjectiveTest {
  id: string;
  title: string;
  skill: 'listening' | 'reading';
  variant: Variant;
  durationMin: number;
  sections: Section[];
  source: 'starter' | 'imported';
  collection?: string;
}

export interface WritingTask {
  prompt: string;
  chart?: { title: string; unit: string; labels: string[]; series: { name: string; values: number[] }[] };
}

export interface WritingTest {
  id: string;
  title: string;
  variant: Variant;
  task1: WritingTask;
  task2: WritingTask;
  source: 'starter' | 'imported';
}

export interface SpeakingTest {
  id: string;
  title: string;
  part1: string[];
  part2: { cue: string; points: string[]; followUp?: string };
  part3: string[];
  source: 'starter' | 'imported';
}

export interface CriterionFeedback {
  criterion: string;
  band: number;
  strengths: string[];
  improvements: string[];
}

export interface AiReport {
  overall: number;
  criteria: CriterionFeedback[];
  summary: string;
  improvedVersion?: string;
}

export interface Attempt {
  id: string;
  testId: string;
  title: string;
  skill: Skill | 'mock';
  variant: Variant;
  date: string; // ISO
  band: number | null; // null = pending marking
  correct?: number;
  total?: number;
  timeSpentSec: number;
  allowedSec?: number;
  mode?: 'practice' | 'simulation';
  answers?: Record<number, string | string[]>;
  writing?: { task1: string; task2: string; report1?: AiReport; report2?: AiReport };
  speaking?: { transcripts: { part: number; question: string; answer: string; audioKey?: string }[]; report?: AiReport };
}

export interface Settings {
  targetBand: number;
  apiKey: string;
  theme: 'light' | 'dark';
  voice?: string;
  name: string;
}
