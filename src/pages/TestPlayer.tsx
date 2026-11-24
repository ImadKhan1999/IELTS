import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { allObjective } from '../data/catalog';
import { store, uid } from '../lib/storage';
import { rawToBand } from '../lib/bands';
import { allQuestions, isAnswered, score, type Answers } from '../lib/scoring';
import Passage, { type Mark } from '../components/Passage';
import QuestionGroupView from '../components/QuestionGroupView';
import ListeningAudio from '../components/ListeningAudio';

type Mode = 'practice' | 'simulation';

export default function TestPlayer() {
  const { id } = useParams();
  const nav = useNavigate();
  const test = useMemo(() => allObjective().find((t) => t.id === id), [id]);
  const settings = store.settings();

  const [mode, setMode] = useState<Mode | null>(null);
  const [pick, setPick] = useState<Mode>('practice');
  const [answers, setAnswers] = useState<Answers>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [sec, setSec] = useState(0);
  const [cur, setCur] = useState<number>(1);
  const [left, setLeft] = useState((test?.durationMin ?? 60) * 60);
  const started = useRef(0);
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [selMenu, setSelMenu] = useState<{ x: number; y: number; start: number; end: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [markMenu, setMarkMenu] = useState<{ x: number; y: number; m: Mark } | null>(null);
  const [notepad, setNotepad] = useState(false);
  const [notes, setNotes] = useState('');
  const [panel, setPanel] = useState<'help' | 'options' | 'submit' | null>(null);
  const [fs, setFs] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [split, setSplit] = useState(50);
  const submitted = useRef(false);

  const qs = useMemo(() => (test ? allQuestions(test) : []), [test]);

  useEffect(() => {
    document.documentElement.dataset.fs = fs;
    return () => { delete document.documentElement.dataset.fs; };
  }, [fs]);

  useEffect(() => {
    if (!mode) return;
    started.current = Date.now();
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [mode]);

  useEffect(() => {
    if (mode && left <= 0 && !submitted.current) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, mode]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (mode && !submitted.current) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [mode]);

  if (!test) return <div className="main"><p>Test not found.</p><button className="btn" onClick={() => nav(-1)}>Back</button></div>;

  const section = test.sections[sec];
  const isReading = test.skill === 'reading';

  function setAnswer(n: number, v: string | string[]) {
    setAnswers((a) => ({ ...a, [n]: v }));
  }
  function toggleFlag(n: number) {
    setFlags((f) => {
      const x = new Set(f);
      if (x.has(n)) x.delete(n); else x.add(n);
      return x;
    });
  }
  function goTo(n: number) {
    const item = qs.find((x) => x.q.number === n);
    if (!item) return;
    setSec(item.si);
    setCur(n);
    setTimeout(() => {
      const target = document.getElementById(`q-${item.g.type === 'multi' ? item.g.questions[0].number : n}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (target?.querySelector('input,select') as HTMLElement | null)?.focus({ preventScroll: true });
    }, 30);
  }
  function step(d: number) {
    const i = qs.findIndex((x) => x.q.number === cur);
    const next = qs[Math.min(qs.length - 1, Math.max(0, i + d))];
    if (next) goTo(next.q.number);
  }

  function addMark(kind: 'hl' | 'note') {
    if (!selMenu) return;
    const note = kind === 'note' ? (noteDraft ?? '').trim() : undefined;
    setNoteDraft(null);
    if (kind === 'note' && !note) { setSelMenu(null); return; }
    setMarks((m) => ({ ...m, [section.id]: [...(m[section.id] ?? []), { id: uid(), start: selMenu.start, end: selMenu.end, kind, note }] }));
    setSelMenu(null);
    window.getSelection()?.removeAllRanges();
  }
  function removeMark(m: Mark) {
    setMarks((all) => ({ ...all, [section.id]: (all[section.id] ?? []).filter((x) => x.id !== m.id) }));
    setMarkMenu(null);
  }

  function finish() {
    if (!test || submitted.current) return;
    submitted.current = true;
    const { correct, total } = score(test, answers);
    const attempt = {
      id: uid(),
      testId: test.id,
      title: test.title,
      skill: test.skill,
      variant: test.variant,
      date: new Date().toISOString(),
      band: rawToBand(correct, total, test.skill, test.variant),
      correct,
      total,
      timeSpentSec: Math.round((Date.now() - started.current) / 1000),
      allowedSec: test.durationMin * 60,
      mode: mode ?? 'practice',
      answers,
    };
    store.saveAttempt(attempt);
    window.speechSynthesis?.cancel();
    nav(`/result/${attempt.id}`, { replace: true });
  }

  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0');
  const ss = String(Math.max(0, left % 60)).padStart(2, '0');
  const answeredCount = qs.filter((x) => isAnswered(x.g, x.q, answers)).length;

  const questionsPane = (
    <div className="pane" style={isReading ? { flex: `0 0 ${100 - split}%` } : undefined}>
      {!isReading && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row">
            <b>{section.title}</b>
            <div className="spacer" />
            <ListeningAudio key={section.id} audio={section.audio} transcript={section.transcript} mode={mode ?? 'practice'} autoStart={mode === 'simulation'} />
          </div>
        </div>
      )}
      {section.groups.map((g) => (
        <QuestionGroupView key={g.id} group={g} answers={answers} setAnswer={setAnswer} flags={flags} toggleFlag={toggleFlag} current={cur} onFocusQ={setCur} />
      ))}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {sec > 0 && <button className="btn" onClick={() => setSec(sec - 1)}>← {test.sections[sec - 1].title}</button>}
        {sec < test.sections.length - 1 && <button className="btn primary" onClick={() => { setSec(sec + 1); document.querySelector('.pane')?.scrollTo(0, 0); }}>{test.sections[sec + 1].title} →</button>}
      </div>
    </div>
  );

  return (
    <div className="exam">
      <div className="exam-top">
        <span className="who">{settings.name}</span>
        <span className="small muted">{test.title}</span>
        <div className="spacer" />
        <span className={`timer ${left < 300 ? 'low' : ''}`} title="Time remaining">⏱ {mm}:{ss}</span>
        <span className="small muted">{answeredCount}/{qs.length} answered</span>
        <div className="spacer" />
        <button className="btn small" onClick={() => setNotepad((n) => !n)}>📝 Notes</button>
        <button className="btn small" onClick={() => setPanel('options')}>⚙ Options</button>
        <button className="btn small" onClick={() => setPanel('help')}>? Help</button>
        <button className="btn small primary" onClick={() => setPanel('submit')}>Submit</button>
      </div>

      <div className="exam-body">
        {isReading ? (
          <>
            <div className="pane" style={{ flex: `0 0 ${split}%` }}>
              {section.passageTitle && <h2>{section.passageTitle}</h2>}
              <p className="small muted">{section.title}. Select text to highlight it or add a note.</p>
              <Passage
                text={section.passage ?? ''}
                marks={marks[section.id] ?? []}
                onSelect={(start, end, r) => setSelMenu({ x: r.left + r.width / 2, y: r.top - 44, start, end })}
                onMarkClick={(m, r) => setMarkMenu({ x: r.left, y: r.bottom + 6, m })}
              />
            </div>
            <div
              className="divider"
              onMouseDown={(e) => {
                const startX = e.clientX, startSplit = split;
                const move = (ev: MouseEvent) => setSplit(Math.min(75, Math.max(25, startSplit + ((ev.clientX - startX) / window.innerWidth) * 100)));
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
            />
            {questionsPane}
          </>
        ) : (
          questionsPane
        )}
      </div>

      <div className="exam-nav">
        {test.sections.map((s, i) => (
          <div className="navpart" key={s.id}>
            <span className="lbl" onClick={() => setSec(i)} style={{ color: i === sec ? 'var(--brand)' : undefined }}>{s.title}</span>
            {s.groups.flatMap((g) => g.questions).map((q) => {
              const g = s.groups.find((gg) => gg.questions.includes(q))!;
              return (
                <button
                  key={q.number}
                  className={`navbtn ${isAnswered(g, q, answers) ? 'answered' : ''} ${flags.has(g.type === 'multi' ? g.questions[0].number : q.number) ? 'flagged' : ''} ${cur === q.number ? 'cur' : ''}`}
                  onClick={() => goTo(q.number)}
                >
                  {q.number}
                </button>
              );
            })}
          </div>
        ))}
        <div className="spacer" />
        <button className="btn small" onClick={() => step(-1)}>‹</button>
        <button className="btn small" onClick={() => step(1)}>›</button>
      </div>

      {selMenu && (
        <div className="selmenu" style={{ left: selMenu.x - 80, top: Math.max(8, selMenu.y) }}>
          {noteDraft === null ? (
            <>
              <button onClick={() => addMark('hl')}>Highlight</button>
              <button onClick={() => setNoteDraft('')}>Add note</button>
            </>
          ) : (
            <>
              <input autoFocus type="text" value={noteDraft} placeholder="Your note" onChange={(e) => setNoteDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMark('note')} style={{ color: 'var(--text)' }} />
              <button onClick={() => addMark('note')}>Save</button>
            </>
          )}
          <button onClick={() => { setSelMenu(null); setNoteDraft(null); }}>✕</button>
        </div>
      )}
      {markMenu && (
        <div className="selmenu" style={{ left: markMenu.x, top: markMenu.y }}>
          {markMenu.m.note && <span style={{ padding: '6px 10px', maxWidth: 240 }}>{markMenu.m.note}</span>}
          <button onClick={() => removeMark(markMenu.m)}>Remove {markMenu.m.kind === 'note' ? 'note' : 'highlight'}</button>
          <button onClick={() => setMarkMenu(null)}>✕</button>
        </div>
      )}

      {notepad && (
        <div className="card notepad">
          <div className="row"><b>Notepad</b><div className="spacer" /><button className="btn small" onClick={() => setNotepad(false)}>✕</button></div>
          <textarea rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scratch notes (not marked)" style={{ marginTop: 8 }} />
        </div>
      )}

      {!mode && (
        <div className="modal-bg">
          <div className="card modal">
            <h2>{test.title}</h2>
            <p className="muted">{qs.length} questions · {test.durationMin} minutes</p>
            <div className="mode-cards">
              <button className={pick === 'practice' ? 'on' : ''} onClick={() => setPick('practice')}>
                <b>Practice mode</b>
                <div className="small muted">{test.skill === 'listening' ? 'Pause, replay and skip the audio.' : 'Same timer, relaxed pace.'}</div>
              </button>
              <button className={pick === 'simulation' ? 'on' : ''} onClick={() => setPick('simulation')}>
                <b>Simulation mode</b>
                <div className="small muted">{test.skill === 'listening' ? 'Audio plays once, like the real exam.' : 'Strict timing, auto-submit at zero.'}</div>
              </button>
            </div>
            <div className="row">
              <button className="btn" onClick={() => nav(-1)}>Cancel</button>
              <div className="spacer" />
              <button className="btn primary" onClick={() => setMode(pick)}>Start test</button>
            </div>
          </div>
        </div>
      )}

      {panel && (
        <div className="modal-bg" onClick={() => setPanel(null)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            {panel === 'help' && (
              <>
                <h2>Help</h2>
                <ul>
                  <li>Use the numbered buttons at the bottom to jump to any question. Filled buttons are answered; a dot means flagged.</li>
                  <li>Click 🚩 next to a question to flag it for review.</li>
                  {isReading && <li>Select text in the passage to highlight it or attach a note. Click a highlight to remove it. Drag the divider to resize the panes.</li>}
                  <li>The test submits automatically when the timer reaches zero.</li>
                </ul>
              </>
            )}
            {panel === 'options' && (
              <>
                <h2>Options</h2>
                <p>Text size</p>
                <div className="row">
                  {(['normal', 'large', 'xlarge'] as const).map((f) => (
                    <button key={f} className={`btn ${fs === f ? 'primary' : ''}`} onClick={() => setFs(f)}>{f === 'normal' ? 'Standard' : f === 'large' ? 'Large' : 'Extra large'}</button>
                  ))}
                </div>
                <p>Colours</p>
                <div className="row">
                  <button className="btn" onClick={() => { document.documentElement.dataset.theme = 'light'; }}>Light</button>
                  <button className="btn" onClick={() => { document.documentElement.dataset.theme = 'dark'; }}>Dark</button>
                </div>
              </>
            )}
            {panel === 'submit' && (
              <>
                <h2>Submit your answers?</h2>
                <p>You have answered {answeredCount} of {qs.length} questions{flags.size ? ` and flagged ${flags.size}` : ''}. You can't change answers after submitting.</p>
                <div className="row">
                  <button className="btn" onClick={() => setPanel(null)}>Keep working</button>
                  <div className="spacer" />
                  <button className="btn primary" onClick={finish}>Submit and see results</button>
                </div>
              </>
            )}
            {panel !== 'submit' && <div className="row" style={{ marginTop: 12 }}><div className="spacer" /><button className="btn" onClick={() => setPanel(null)}>Close</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}
