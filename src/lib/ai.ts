import Anthropic from '@anthropic-ai/sdk';
import type { AiReport, WritingTask } from '../types';
import { store } from './storage';

const MODEL = 'claude-opus-5-5';

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['overall', 'criteria', 'summary', 'improvedVersion'],
  properties: {
    overall: { type: 'number' },
    summary: { type: 'string' },
    improvedVersion: { type: 'string' },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterion', 'band', 'strengths', 'improvements'],
        properties: {
          criterion: { type: 'string' },
          band: { type: 'number' },
          strengths: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

function client(): Anthropic {
  const key = store.settings().apiKey;
  if (!key) throw new Error('Add your Anthropic API key in Settings to use AI marking.');
  // Personal app: the key lives only in this browser's localStorage.
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

async function askForReport(system: string, user: string): Promise<AiReport> {
  let response;
  try {
    response = await client().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: REPORT_SCHEMA } },
      system,
      messages: [{ role: 'user', content: user }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error('Your API key was rejected. Check it in Settings.');
    if (error instanceof Anthropic.RateLimitError) throw new Error('Rate limited by the API. Try again in a minute.');
    if (error instanceof Anthropic.APIError) throw new Error(`AI marking failed (${error.status}): ${error.message}`);
    throw error;
  }
  if (response.stop_reason === 'refusal') throw new Error('The AI declined to mark this response.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return JSON.parse(text) as AiReport;
}

const EXAMINER = `You are an experienced, strict but encouraging IELTS examiner. Mark exactly as a certified examiner would, using the public IELTS band descriptors. Use half bands (e.g. 6.5). Quote the candidate's own words when pointing out errors. Keep each bullet short and actionable.`;

export function markWriting(taskNo: 1 | 2, variant: 'academic' | 'general', task: WritingTask, answer: string): Promise<AiReport> {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const c1 = taskNo === 1 ? (variant === 'academic' ? 'Task Achievement' : 'Task Achievement (letter)') : 'Task Response';
  const chart = task.chart ? `\nChart data (JSON): ${JSON.stringify(task.chart)}` : '';
  return askForReport(
    EXAMINER,
    `Mark this IELTS ${variant === 'academic' ? 'Academic' : 'General Training'} Writing Task ${taskNo} response.
Criteria (use these exact names, in this order): ${c1}; Coherence and Cohesion; Lexical Resource; Grammatical Range and Accuracy.
"overall" is the task band (mean of the four, rounded to nearest half). Minimum length is ${taskNo === 1 ? 150 : 250} words; the response has ${words} words, so penalise under-length as an examiner would.
"improvedVersion" is a band-8 rewrite of the candidate's response that keeps their ideas.

TASK:
${task.prompt}${chart}

CANDIDATE RESPONSE:
${answer || '(no response)'}`,
  );
}

export function markSpeaking(items: { part: number; question: string; answer: string }[]): Promise<AiReport> {
  const body = items.map((i) => `[Part ${i.part}] Q: ${i.question}\nA: ${i.answer || '(no answer)'}`).join('\n\n');
  return askForReport(
    EXAMINER,
    `Mark this IELTS Speaking test from an automatic speech-to-text transcript (punctuation and some words may be wrong; do not penalise transcription artefacts, and judge pronunciation cautiously from word choice and recognisability only).
Criteria (use these exact names, in this order): Fluency and Coherence; Lexical Resource; Grammatical Range and Accuracy; Pronunciation.
"overall" is the mean of the four, rounded to nearest half band.
"improvedVersion" gives a model band-8 answer for the Part 2 cue card in the candidate's style.

TRANSCRIPT:
${body}`,
  );
}

export async function askTutor(history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const response = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: 'You are a friendly IELTS tutor. Give clear, practical advice on IELTS strategy, grammar, vocabulary and essay feedback. Be concise and use short lists where it helps.',
    messages: history,
  });
  if (response.stop_reason === 'refusal') return 'Sorry, I cannot help with that.';
  return response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
}

/**
 * Converts pasted test text (passage/transcript, questions and answer key) into this app's JSON test format.
 * Returns the raw JSON string for the user to check before saving.
 */
export async function convertToTest(kind: 'reading' | 'listening', raw: string, example: string): Promise<string> {
  // Long output: stream to avoid HTTP timeouts, then take the final message.
  const response = await client().beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: 'You convert IELTS practice test text into a strict JSON format. Output only the JSON object, with no commentary and no code fences.',
    messages: [{
      role: 'user',
      content: `Convert this ${kind} test into JSON matching exactly the structure of the example below.
Rules: keep the original wording of passages/transcripts and questions; question numbers must match the source; use types gap / mcq / multi / tfng / ynng / match; for gap questions mark the blank with ___; put every accepted answer variant in "answer"; if the answer key is missing, leave "answer" as [] rather than guessing; add a short "explanation" and an exact "evidence" quote from the passage/transcript when the answer can be located; ${kind === 'listening' ? 'split the transcript into lines formatted "Speaker: text"; leave "audio" out' : 'separate paragraphs with a blank line'}.

EXAMPLE:
${example}

SOURCE TEXT:
${raw}`,
    }],
  }).finalMessage();
  if (response.stop_reason === 'refusal') throw new Error('The AI declined to convert this text.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 ? text.slice(start, end + 1) : text;
}
