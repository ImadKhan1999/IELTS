import type { QuestionGroup } from '../types';
import type { Answers } from '../lib/scoring';
import { groupKey, isCorrect, userAnswerFor } from '../lib/scoring';

const TF = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YN = ['YES', 'NO', 'NOT GIVEN'];

interface Props {
  group: QuestionGroup;
  answers: Answers;
  setAnswer?: (n: number, v: string | string[]) => void;
  flags?: Set<number>;
  toggleFlag?: (n: number) => void;
  current?: number;
  onFocusQ?: (n: number) => void;
  review?: boolean;
  onExplain?: (n: number) => void;
  onLocate?: (n: number) => void;
  explained?: Set<number>;
}

export default function QuestionGroupView({ group: g, answers, setAnswer, flags, toggleFlag, current, onFocusQ, review, onExplain, onLocate, explained }: Props) {
  const disabled = !!review;

  const reviewLine = (n: number) => {
    const q = g.questions.find((x) => x.number === n)!;
    const ok = isCorrect(g, q, answers);
    return (
      <div className={`ans ${ok ? 'ok' : 'no'}`} style={{ marginTop: 6 }}>
        <div className="row small">
          <span>{ok ? '✓ Correct' : '✗ Incorrect'}</span>
          <span>Your answer: <b>{userAnswerFor(g, q, answers) || '(blank)'}</b></span>
          <span>Correct: <b>{q.answer.join(' / ')}</b></span>
          <div className="spacer" />
          {q.explanation && <button className="btn small" onClick={() => onExplain?.(n)}>Explain</button>}
          {q.evidence && <button className="btn small" onClick={() => onLocate?.(n)}>Locate</button>}
        </div>
        {explained?.has(n) && q.explanation && <div className="small" style={{ marginTop: 6 }}>💡 {q.explanation}</div>}
      </div>
    );
  };

  const flag = (n: number) =>
    toggleFlag && (
      <button className={`flag ${flags?.has(n) ? 'on' : ''}`} title="Flag for review" onClick={() => toggleFlag(n)}>🚩</button>
    );

  if (g.type === 'multi') {
    const k = groupKey(g);
    const picks = (answers[k] as string[] | undefined) ?? [];
    const max = g.questions.length;
    const nums = g.questions.map((q) => q.number);
    return (
      <div className="qgroup">
        {g.title && <h3>{g.title}</h3>}
        <div className="instr">{g.instructions}</div>
        <div className={`q ${nums.includes(current ?? -1) ? 'current' : ''}`} id={`q-${k}`} onClick={() => onFocusQ?.(k)}>
          <span className="qn">{nums[0]}–{nums[nums.length - 1]}</span>
          <div style={{ flex: 1 }}>
            {g.options?.map((o) => (
              <label key={o.key}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={picks.includes(o.key)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...picks, o.key].slice(-max) : picks.filter((p) => p !== o.key);
                    setAnswer?.(k, next);
                  }}
                />{' '}
                <b>{o.key}</b> {o.text}
              </label>
            ))}
            <div className="small muted">Choose {max}.</div>
            {review && g.questions.map((q) => <div key={q.number}>{reviewLine(q.number)}</div>)}
          </div>
          {flag(k)}
        </div>
      </div>
    );
  }

  return (
    <div className="qgroup">
      {g.title && <h3>{g.title}</h3>}
      <div className="instr">{g.instructions}</div>
      {g.type === 'match' && g.options && (
        <div className="opt-list">
          {g.options.map((o) => (
            <div key={o.key}><b>{o.key}</b>&nbsp;&nbsp;{o.text}</div>
          ))}
        </div>
      )}
      {g.questions.map((q) => {
        const val = (answers[q.number] as string | undefined) ?? '';
        const set = (v: string) => setAnswer?.(q.number, v);
        let input: React.ReactNode = null;
        if (g.type === 'gap') {
          const parts = (q.prompt ?? '___').split('___');
          const box = (
            <input
              type="text"
              value={val}
              disabled={disabled}
              placeholder={String(q.number)}
              onChange={(e) => set(e.target.value)}
              onFocus={() => onFocusQ?.(q.number)}
              autoComplete="off"
              spellCheck={false}
            />
          );
          input = parts.length > 1 ? (
            <span>{parts[0]}{box}{parts.slice(1).join('___')}</span>
          ) : (
            <span>{q.prompt} {box}</span>
          );
        } else if (g.type === 'mcq') {
          input = (
            <div>
              <div>{q.prompt}</div>
              {q.options?.map((o) => (
                <label key={o.key}>
                  <input type="radio" name={`q${q.number}`} disabled={disabled} checked={val === o.key} onChange={() => set(o.key)} /> <b>{o.key}</b> {o.text}
                </label>
              ))}
            </div>
          );
        } else {
          const opts = g.type === 'tfng' ? TF : g.type === 'ynng' ? YN : (g.options ?? []).map((o) => o.key);
          input = (
            <div className="row" style={{ alignItems: 'baseline' }}>
              <span style={{ flex: 1, minWidth: 200 }}>{q.prompt}</span>
              <select value={val} disabled={disabled} onChange={(e) => set(e.target.value)} onFocus={() => onFocusQ?.(q.number)}>
                <option value="">—</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
        }
        return (
          <div key={q.number} className={`q ${current === q.number ? 'current' : ''}`} id={`q-${q.number}`} onClick={() => onFocusQ?.(q.number)}>
            <span className="qn">{q.number}</span>
            <div style={{ flex: 1 }}>
              {input}
              {review && reviewLine(q.number)}
            </div>
            {flag(q.number)}
          </div>
        );
      })}
    </div>
  );
}
