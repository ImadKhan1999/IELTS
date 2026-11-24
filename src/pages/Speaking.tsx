import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allSpeaking, useStore } from '../data/catalog';
import { putBlob, store, uid } from '../lib/storage';
import { markSpeaking } from '../lib/ai';
import type { Attempt, SpeakingTest } from '../types';

type Step = { part: 1 | 2 | 3; question: string; kind: 'question' | 'cue' };
type Rec = { part: number; question: string; answer: string; audioKey?: string };

// Minimal typing for the Web Speech API (not in TS DOM lib everywhere).
type SR = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>; resultIndex: number }) => void) | null; onend: (() => void) | null };
const SpeechRec: (new () => SR) | undefined = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;

function buildSteps(t: SpeakingTest, scope: 'full' | 1 | 2 | 3): Step[] {
  const out: Step[] = [];
  if (scope === 'full' || scope === 1) t.part1.forEach((q) => out.push({ part: 1, question: q, kind: 'question' }));
  if (scope === 'full' || scope === 2) {
    out.push({ part: 2, question: t.part2.cue, kind: 'cue' });
    if (t.part2.followUp) out.push({ part: 2, question: t.part2.followUp, kind: 'question' });
  }
  if (scope === 'full' || scope === 3) t.part3.forEach((q) => out.push({ part: 3, question: q, kind: 'question' }));
  return out;
}

export default function Speaking() {
  const nav = useNavigate();
  const imported = useStore(store.importedSpeaking);
  void imported;
  const tests = allSpeaking();
  const [testId, setTestId] = useState(tests[0]?.id ?? '');
  const test = tests.find((t) => t.id === testId);
  const [scope, setScope] = useState<'full' | 1 | 2 | 3>('full');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState(store.settings().voice ?? '');
  const [micLevel, setMicLevel] = useState<number | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'speaking' | 'prep' | 'recording' | 'idle'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [live, setLive] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recog = useRef<SR | null>(null);
  const transcript = useRef('');
  const started = useRef(0);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en')));
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); window.speechSynthesis.cancel(); }, []);

  // Countdown for Part 2 preparation / long turn
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);
  useEffect(() => {
    if (countdown !== 0) return;
    if (phase === 'prep') startRecording(120);
    else if (phase === 'recording' && steps?.[idx].kind === 'cue') stopAndNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function say(text: string, done: () => void) {
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === voice);
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = done;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function micTest() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      ctx.createMediaStreamSource(s).connect(an);
      const data = new Uint8Array(an.fftSize);
      let n = 0;
      const tick = () => {
        an.getByteTimeDomainData(data);
        setMicLevel(Math.min(100, Math.round((Math.max(...data) - 128) * 1.6)));
        if (++n < 180) requestAnimationFrame(tick);
        else { s.getTracks().forEach((t) => t.stop()); ctx.close(); setMicLevel(null); }
      };
      tick();
    } catch {
      setError('Microphone access was blocked. Allow the microphone in your browser to take the speaking test.');
    }
  }

  async function begin() {
    if (!test) return;
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access was blocked. Allow the microphone in your browser to take the speaking test.');
      return;
    }
    store.saveSettings({ ...store.settings(), voice });
    const s = buildSteps(test, scope);
    setSteps(s);
    setRecs([]);
    setIdx(0);
    started.current = Date.now();
    ask(s, 0);
  }

  function ask(s: Step[], i: number) {
    const step = s[i];
    setPhase('speaking');
    setLive('');
    if (step.kind === 'cue') {
      say("Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to prepare. You can make notes if you wish.", () => {
        setPhase('prep');
        setCountdown(60);
      });
    } else {
      say(step.question, () => startRecording(0));
    }
  }

  function startRecording(limit: number) {
    if (!stream.current) return;
    const chunks: Blob[] = [];
    const mr = new MediaRecorder(stream.current);
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => { (mr as MediaRecorder & { blob?: Blob }).blob = new Blob(chunks, { type: mr.mimeType }); };
    mr.start();
    media.current = mr;
    transcript.current = '';
    if (SpeechRec) {
      const r = new SpeechRec();
      r.lang = 'en-GB';
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        let finalText = '', interim = '';
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText += res[0].transcript + ' ';
          else interim += res[0].transcript;
        }
        transcript.current = finalText.trim();
        setLive((finalText + interim).trim());
      };
      r.onend = () => { if (media.current?.state === 'recording') try { r.start(); } catch { /* already started */ } };
      try { r.start(); } catch { /* ignore */ }
      recog.current = r;
    }
    setPhase('recording');
    if (limit) setCountdown(limit);
  }

  async function stopAndNext() {
    if (!steps) return;
    const mr = media.current;
    const r = recog.current;
    media.current = null;
    recog.current = null;
    r?.stop();
    setCountdown(0);
    let audioKey: string | undefined;
    if (mr && mr.state !== 'inactive') {
      await new Promise<void>((res) => { mr.addEventListener('stop', () => setTimeout(res, 0), { once: true }); mr.stop(); });
      const blob = (mr as MediaRecorder & { blob?: Blob }).blob;
      if (blob) { audioKey = `rec-${uid()}`; await putBlob(audioKey, blob); }
    }
    const step = steps[idx];
    const rec: Rec = { part: step.part, question: step.question, answer: transcript.current || live, audioKey };
    const all = [...recs, rec];
    setRecs(all);
    if (idx + 1 < steps.length) {
      setIdx(idx + 1);
      ask(steps, idx + 1);
    } else {
      finish(all);
    }
  }

  async function finish(all: Rec[]) {
    if (!test) return;
    stream.current?.getTracks().forEach((t) => t.stop());
    setPhase('idle');
    const attempt: Attempt = {
      id: uid(), testId: test.id, title: test.title + (scope === 'full' ? '' : ` (Part ${scope})`), skill: 'speaking', variant: 'academic',
      date: new Date().toISOString(), band: null, timeSpentSec: Math.round((Date.now() - started.current) / 1000), speaking: { transcripts: all },
    };
    store.saveAttempt(attempt);
    if (!store.settings().apiKey) { nav(`/result/${attempt.id}`); return; }
    setStatus('The examiner is marking your test…');
    try {
      const report = await markSpeaking(all);
      store.saveAttempt({ ...attempt, band: report.overall, speaking: { transcripts: all, report } });
    } catch (e) {
      setError((e as Error).message);
    }
    nav(`/result/${attempt.id}`);
  }

  if (status) return <div className="card"><h2>{status}</h2><p className="muted">This usually takes under a minute.</p></div>;

  if (steps) {
    const step = steps[idx];
    return (
      <div style={{ maxWidth: 720 }}>
        <div className="row"><h1>Part {step.part}</h1><div className="spacer" /><span className="pill">Question {idx + 1} of {steps.length}</span></div>
        <div className="card section">
          {step.kind === 'cue' && test ? (
            <>
              <h3>{test.part2.cue}</h3>
              <p className="small">You should say:</p>
              <ul>{test.part2.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </>
          ) : (
            <h2>{phase === 'speaking' ? '🗣 The examiner is asking…' : step.question}</h2>
          )}
          <div className="row section">
            {phase === 'prep' && <span className="timer">Preparation: {countdown}s</span>}
            {phase === 'recording' && <span className="timer low">● Recording{countdown ? ` · ${countdown}s left` : ''}</span>}
            <div className="spacer" />
            {phase === 'prep' && <button className="btn" onClick={() => { setCountdown(0); startRecording(120); }}>Start speaking now</button>}
            {phase === 'recording' && <button className="btn primary" onClick={stopAndNext}>{idx + 1 < steps.length ? 'Done, next question →' : 'Finish test'}</button>}
          </div>
          {phase === 'prep' && <textarea rows={5} placeholder="Notes (not marked)" style={{ marginTop: 12 }} />}
          {phase === 'recording' && SpeechRec && <p className="small muted" style={{ marginTop: 12 }}>{live || 'Listening…'}</p>}
          {phase === 'recording' && !SpeechRec && <p className="small muted" style={{ marginTop: 12 }}>Live transcription isn't supported in this browser (use Chrome or Edge for AI feedback). Your audio is still recorded.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Speaking</h1>
      <p className="muted">The examiner reads each question aloud. Answer out loud; you're recorded and transcribed, then the AI examiner marks you on the four criteria. {!store.settings().apiKey && <>Add an API key in <Link to="/settings">Settings</Link> for AI feedback.</>}</p>
      {error && <div className="error">{error}</div>}
      <div className="card section" style={{ maxWidth: 620 }}>
        <div className="tabs">
          {(['full', 1, 2, 3] as const).map((s) => <button key={s} className={scope === s ? 'on' : ''} onClick={() => setScope(s)}>{s === 'full' ? 'Full test' : `Part ${s}`}</button>)}
        </div>
        <label className="small muted">Test</label>
        <select value={testId} onChange={(e) => setTestId(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
          {tests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <label className="small muted">Examiner voice</label>
        <select value={voice} onChange={(e) => setVoice(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
          <option value="">Browser default</option>
          {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
        </select>
        <div className="row">
          <button className="btn" onClick={micTest}>🎤 Mic test</button>
          <button className="btn" onClick={() => say('Good morning. My name is your examiner. Can you hear me clearly?', () => undefined)}>🔊 Sound test</button>
          {micLevel !== null && <div style={{ width: 120, height: 8, background: 'var(--surface-2)', borderRadius: 4 }}><div style={{ width: `${micLevel}%`, height: '100%', background: 'var(--good)', borderRadius: 4 }} /></div>}
          <div className="spacer" />
          <button className="btn primary" disabled={!test} onClick={begin}>Start test →</button>
        </div>
      </div>
    </div>
  );
}
