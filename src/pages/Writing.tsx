import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allWriting, useStore } from '../data/catalog';
import { store, uid } from '../lib/storage';
import { markWriting } from '../lib/ai';
import type { Attempt, Variant, WritingTask } from '../types';

const count = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export default function Writing() {
  const nav = useNavigate();
  const imported = useStore(store.importedWriting);
  void imported;
  const [variant, setVariant] = useState<Variant>('academic');
  const tests = allWriting().filter((t) => t.variant === variant);
  const [testId, setTestId] = useState('');
  const test = tests.find((t) => t.id === testId) ?? tests[0];
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<1 | 2>(1);
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [left, setLeft] = useState(3600);
  const started = useRef(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasKey = !!store.settings().apiKey;

  useEffect(() => {
    if (!running) return;
    started.current = Date.now();
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && left <= 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  async function submit() {
    if (!test || status) return;
    setRunning(false);
    const attempt: Attempt = {
      id: uid(),
      testId: test.id,
      title: test.title,
      skill: 'writing',
      variant: test.variant,
      date: new Date().toISOString(),
      band: null,
      timeSpentSec: Math.round((Date.now() - started.current) / 1000),
      allowedSec: 3600,
      writing: { task1: t1, task2: t2 },
    };
    store.saveAttempt(attempt);
    if (!hasKey) { nav(`/result/${attempt.id}`); return; }
    try {
      setStatus('Marking Task 1 and Task 2…');
      const [r1, r2] = await Promise.all([
        markWriting(1, test.variant, test.task1, t1),
        markWriting(2, test.variant, test.task2, t2),
      ]);
      // Task 2 counts twice as much as Task 1.
      const band = Math.round(((r1.overall + 2 * r2.overall) / 3) * 2) / 2;
      store.saveAttempt({ ...attempt, band, writing: { task1: t1, task2: t2, report1: r1, report2: r2 } });
      nav(`/result/${attempt.id}`);
    } catch (e) {
      setStatus(null);
      setError(`${(e as Error).message} Your answers were saved; the result shows as pending.`);
    }
  }

  if (!running && !status) {
    return (
      <div>
        <h1>Writing</h1>
        <p className="muted">Both tasks in one sitting: 60 minutes, about 20 for Task 1 and 40 for Task 2. {hasKey ? 'Your answers are marked by the AI examiner when you submit.' : <>Add an API key in <Link to="/settings">Settings</Link> to get AI marking.</>}</p>
        {error && <div className="error">{error}</div>}
        <div className="card section" style={{ maxWidth: 560 }}>
          <div className="row">
            <select value={variant} onChange={(e) => { setVariant(e.target.value as Variant); setTestId(''); }}>
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
            <select value={test?.id ?? ''} onChange={(e) => setTestId(e.target.value)} style={{ flex: 1 }}>
              {tests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <Link to="/import">+ Import prompts</Link>
            <div className="spacer" />
            <button className="btn primary" disabled={!test} onClick={() => { setT1(''); setT2(''); setLeft(3600); setTab(1); setRunning(true); }}>Start test</button>
          </div>
        </div>
      </div>
    );
  }

  if (status) return <div className="card"><h2>{status}</h2><p className="muted">This usually takes under a minute.</p></div>;

  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0');
  const ss = String(Math.max(0, left % 60)).padStart(2, '0');
  const task = tab === 1 ? test!.task1 : test!.task2;
  const text = tab === 1 ? t1 : t2;
  const min = tab === 1 ? 150 : 250;

  return (
    <div className="exam">
      <div className="exam-top">
        <b>{test!.title}</b>
        <div className="tabs" style={{ margin: 0, border: 'none' }}>
          <button className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>Task 1 ({count(t1)})</button>
          <button className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>Task 2 ({count(t2)})</button>
        </div>
        <div className="spacer" />
        <span className={`timer ${left < 300 ? 'low' : ''}`}>⏱ {mm}:{ss}</span>
        <button className="btn small" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>⛶ Full screen</button>
        <button className="btn small primary" onClick={submit}>Submit</button>
      </div>
      <div className="exam-body">
        <div className="pane">
          <h3>Writing Task {tab}</h3>
          <p className="small muted">Spend about {tab === 1 ? 20 : 40} minutes on this task.</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{task.prompt}</p>
          {task.chart && <Chart chart={task.chart} />}
        </div>
        <div className="pane">
          <textarea className="write-area" style={{ height: 'calc(100% - 40px)' }} value={text} onChange={(e) => (tab === 1 ? setT1 : setT2)(e.target.value)} placeholder="Type your response here…" spellCheck={false} />
          <div className="row small" style={{ marginTop: 8 }}>
            <span>Word count: <b>{count(text)}</b></span>
            {count(text) < min && <span className="muted">({min - count(text)} more to reach {min})</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

const COLORS = ['var(--brand)', '#e0a030', '#2fa37a', '#c45c8a'];

export function Chart({ chart }: { chart: NonNullable<WritingTask['chart']> }) {
  const max = Math.max(...chart.series.flatMap((s) => s.values)) * 1.1;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <b className="small">{chart.title}</b>
      <div className="legend small" style={{ margin: '6px 0' }}>{chart.series.map((s, i) => <span key={s.name}><i style={{ background: COLORS[i % 4] }} />{s.name}</span>)}</div>
      <div className="bar">
        {chart.labels.map((l, li) => (
          <div className="col" key={l}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 150, width: '100%', justifyContent: 'center' }}>
              {chart.series.map((s, si) => (
                <div key={s.name} title={`${s.name}: ${s.values[li]}${chart.unit}`} className="fill" style={{ height: `${(s.values[li] / max) * 100}%`, background: COLORS[si % 4], maxWidth: 22 }}>
                  <span style={{ fontSize: 9, display: 'block', textAlign: 'center', transform: 'translateY(-14px)', color: 'var(--text)' }}>{s.values[li]}</span>
                </div>
              ))}
            </div>
            <span className="small">{l}</span>
          </div>
        ))}
      </div>
      <div className="small muted">Unit: {chart.unit}</div>
    </div>
  );
}
