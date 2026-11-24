import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { allObjective, allSpeaking, allWriting } from '../data/catalog';
import { getBlob, store } from '../lib/storage';
import { fmtBand } from '../lib/bands';
import Passage, { type Mark } from '../components/Passage';
import QuestionGroupView from '../components/QuestionGroupView';
import ReportView from '../components/ReportView';
import { markSpeaking, markWriting } from '../lib/ai';
import type { Attempt } from '../types';

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Result() {
  const { id } = useParams();
  const nav = useNavigate();
  const attempt = store.attempts().find((a) => a.id === id);
  if (!attempt) return <p>Result not found. <Link to="/">Back to dashboard</Link></p>;

  return (
    <div>
      <div className="row">
        <Link to="/">← Dashboard</Link>
        <div className="spacer" />
        <button className="btn small danger" onClick={() => { store.deleteAttempt(attempt.id); nav('/'); }}>Delete result</button>
      </div>
      {attempt.skill === 'listening' || attempt.skill === 'reading' ? (
        <ObjectiveResult a={attempt} />
      ) : attempt.skill === 'writing' ? (
        <WritingResult a={attempt} />
      ) : (
        <SpeakingResult a={attempt} />
      )}
    </div>
  );
}

function Header({ a, extra }: { a: Attempt; extra?: React.ReactNode }) {
  return (
    <div className="card section">
      <div className="row" style={{ gap: 28 }}>
        <div className="ring"><b>{fmtBand(a.band)}</b><span className="small muted">Band</span></div>
        <div>
          <h1>{a.title}</h1>
          <div className="muted small">{new Date(a.date).toLocaleString()} {a.mode && `· ${a.mode} mode`}</div>
          <div className="row" style={{ marginTop: 12, gap: 24 }}>
            {a.total !== undefined && <div className="stat"><span className="small muted">Correct</span><b>{a.correct}/{a.total}</b></div>}
            <div className="stat"><span className="small muted">Time spent</span><b>{fmtTime(a.timeSpentSec)}{a.allowedSec ? <span className="small muted"> / {fmtTime(a.allowedSec)}</span> : null}</b></div>
            {extra}
          </div>
        </div>
      </div>
    </div>
  );
}

function ObjectiveResult({ a }: { a: Attempt }) {
  const test = useMemo(() => allObjective().find((t) => t.id === a.testId), [a.testId]);
  const [sec, setSec] = useState(0);
  const [explained, setExplained] = useState<Set<number>>(new Set());
  const [locate, setLocate] = useState<Mark | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (locate) document.getElementById('locate-target')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [locate]);

  if (!test) return <><Header a={a} /><p className="muted">The test for this result is no longer available, so the review can't be shown.</p></>;
  const section = test.sections[sec];
  const source = test.skill === 'reading' ? section.passage ?? '' : section.transcript ?? '';

  function doLocate(n: number) {
    const q = section.groups.flatMap((g) => g.questions).find((x) => x.number === n);
    if (!q?.evidence) return;
    const start = source.toLowerCase().indexOf(q.evidence.toLowerCase());
    if (start < 0) return;
    if (test?.skill === 'listening') setShowTranscript(true);
    setLocate({ id: 'loc', start, end: start + q.evidence.length, kind: 'locate' });
  }

  return (
    <>
      <Header a={a} extra={<Link className="btn primary" to={`/test/${test.id}`}>Retake</Link>} />
      <div className="section">
        <div className="tabs">
          {test.sections.map((s, i) => (
            <button key={s.id} className={i === sec ? 'on' : ''} onClick={() => { setSec(i); setLocate(null); }}>{s.title}</button>
          ))}
        </div>
        <div className="write-grid">
          <div className="card" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {test.skill === 'reading' ? (
              <>
                {section.passageTitle && <h2>{section.passageTitle}</h2>}
                <Passage text={source} marks={locate ? [locate] : []} />
              </>
            ) : (
              <>
                <div className="row"><h3>Transcript</h3><div className="spacer" /><button className="btn small" onClick={() => setShowTranscript((x) => !x)}>{showTranscript ? 'Hide' : 'Show'}</button></div>
                {showTranscript ? <Passage text={source.split('\n').join('\n\n')} marks={locate ? [{ ...locate, ...shiftForDoubleNewlines(source, locate) }] : []} /> : <p className="muted small">Use Locate on a question to see where the answer is in the transcript.</p>}
              </>
            )}
          </div>
          <div className="card" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <h3>Review your answers</h3>
            {section.groups.map((g) => (
              <QuestionGroupView
                key={g.id}
                group={g}
                answers={a.answers ?? {}}
                review
                explained={explained}
                onExplain={(n) => setExplained((e) => new Set(e).add(n))}
                onLocate={doLocate}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// The transcript is rendered with each line as its own paragraph (\n → \n\n), so offsets shift by one per earlier newline.
function shiftForDoubleNewlines(src: string, m: Mark) {
  const before = (src.slice(0, m.start).match(/\n/g) ?? []).length;
  const inside = (src.slice(m.start, m.end).match(/\n/g) ?? []).length;
  return { start: m.start + before, end: m.end + before + inside };
}

function WritingResult({ a }: { a: Attempt }) {
  const test = allWriting().find((t) => t.id === a.testId);
  const w = a.writing!;
  const [tab, setTab] = useState<1 | 2>(1);
  const text = tab === 1 ? w.task1 : w.task2;
  const report = tab === 1 ? w.report1 : w.report2;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <>
      <Header a={a} extra={<><div className="stat"><span className="small muted">Task 1</span><b>{fmtBand(w.report1?.overall)}</b></div><div className="stat"><span className="small muted">Task 2</span><b>{fmtBand(w.report2?.overall)}</b></div></>} />
      <div className="section tabs">
        <button className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>Task 1</button>
        <button className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>Task 2</button>
      </div>
      <div className="write-grid">
        <div className="card">
          <h3>Task</h3>
          <p style={{ whiteSpace: 'pre-wrap' }} className="small">{tab === 1 ? test?.task1.prompt : test?.task2.prompt}</p>
          <h3>Your response <span className="pill">{words} words</span></h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{text || <span className="muted">(blank)</span>}</p>
        </div>
        <div className="card">{report ? <ReportView report={report} /> : <MarkNow run={async () => {
          if (!test) throw new Error('The prompts for this test are no longer available.');
          const [r1, r2] = await Promise.all([markWriting(1, test.variant, test.task1, w.task1), markWriting(2, test.variant, test.task2, w.task2)]);
          store.saveAttempt({ ...a, band: Math.round(((r1.overall + 2 * r2.overall) / 3) * 2) / 2, writing: { ...w, report1: r1, report2: r2 } });
        }} />}</div>
      </div>
    </>
  );
}

function SpeakingResult({ a }: { a: Attempt }) {
  const sp = a.speaking!;
  const [urls, setUrls] = useState<Record<string, string>>({});
  const test = allSpeaking().find((t) => t.id === a.testId);
  void test;
  useEffect(() => {
    const made: string[] = [];
    Promise.all(sp.transcripts.map(async (t) => {
      if (!t.audioKey) return;
      const b = await getBlob(t.audioKey);
      if (b) { const u = URL.createObjectURL(b); made.push(u); setUrls((x) => ({ ...x, [t.audioKey!]: u })); }
    }));
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [sp]);
  return (
    <>
      <Header a={a} />
      <div className="write-grid section">
        <div className="card">
          <h3>Your recordings</h3>
          {[1, 2, 3].map((part) => (
            <div key={part} style={{ marginBottom: 16 }}>
              <h4>Part {part}</h4>
              {sp.transcripts.filter((t) => t.part === part).map((t, i) => (
                <div key={i} className="ans">
                  <div className="small"><b>Q:</b> {t.question}</div>
                  {t.audioKey && urls[t.audioKey] && <audio controls src={urls[t.audioKey]} style={{ width: '100%', marginTop: 6 }} />}
                  <div className="small muted" style={{ marginTop: 4 }}>{t.answer || '(no speech recognised)'}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="card">{sp.report ? <ReportView report={sp.report} /> : <MarkNow run={async () => {
          const report = await markSpeaking(sp.transcripts);
          store.saveAttempt({ ...a, band: report.overall, speaking: { ...sp, report } });
        }} />}</div>
      </div>
    </>
  );
}

function MarkNow({ run }: { run: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hasKey = !!store.settings().apiKey;
  return (
    <div>
      <h3>Not marked yet</h3>
      {!hasKey ? (
        <p className="muted">Add your Anthropic API key in <Link to="/settings">Settings</Link>, then come back here to get the AI examiner's report.</p>
      ) : (
        <button className="btn primary" disabled={busy} onClick={async () => {
          setBusy(true); setErr(null);
          try { await run(); window.location.reload(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        }}>{busy ? 'Marking…' : 'Mark now with AI'}</button>
      )}
      {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}
