import type { ObjectiveTest, Question, QuestionGroup } from '../types';
import { normalise } from './bands';

export type Answers = Record<number, string | string[]>;

/** Multi-select groups store their picks under the group's first question number. */
export function groupKey(g: QuestionGroup): number {
  return g.questions[0].number;
}

export function userAnswerFor(g: QuestionGroup, q: Question, answers: Answers): string {
  if (g.type === 'multi') {
    const picks = (answers[groupKey(g)] as string[] | undefined) ?? [];
    return picks.join(', ');
  }
  return (answers[q.number] as string | undefined) ?? '';
}

export function isCorrect(g: QuestionGroup, q: Question, answers: Answers): boolean {
  if (g.type === 'multi') {
    const picks = ((answers[groupKey(g)] as string[] | undefined) ?? []).map((p) => p.toLowerCase());
    // Each correct key that was picked earns one mark; assign marks in question order.
    const correctPicked = g.questions.filter((x) => picks.includes(x.answer[0].toLowerCase()));
    return correctPicked.some((x) => x.number === q.number);
  }
  const a = answers[q.number];
  if (typeof a !== 'string' || !a.trim()) return false;
  if (g.type === 'gap') return q.answer.some((acc) => normalise(acc) === normalise(a));
  return q.answer.some((acc) => acc.toLowerCase() === a.toLowerCase());
}

export function isAnswered(g: QuestionGroup, q: Question, answers: Answers): boolean {
  if (g.type === 'multi') return (((answers[groupKey(g)] as string[]) ?? []).length) > 0;
  const a = answers[q.number];
  return typeof a === 'string' && a.trim() !== '';
}

export function score(test: ObjectiveTest, answers: Answers) {
  let correct = 0, total = 0;
  for (const s of test.sections)
    for (const g of s.groups)
      for (const q of g.questions) {
        total++;
        if (isCorrect(g, q, answers)) correct++;
      }
  return { correct, total };
}

export function allQuestions(test: ObjectiveTest) {
  return test.sections.flatMap((s, si) => s.groups.flatMap((g) => g.questions.map((q) => ({ s, si, g, q }))));
}
