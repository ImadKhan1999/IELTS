import { useState } from 'react';
import { allObjective, useStore } from '../data/catalog';
import { starterReading } from '../data/starterReading';
import { starterListening, starterSpeaking, starterWriting } from '../data/starterOther';
import { putBlob, store, uid } from '../lib/storage';
import { convertToTest } from '../lib/ai';
import type { ObjectiveTest, SpeakingTest, WritingTest } from '../types';

type Kind = 'reading' | 'listening' | 'writing' | 'speaking';

function template(kind: Kind): string {
  const strip = <T extends object>(t: T) => ({ ...t, id: undefined, source: undefined });
  if (kind === 'reading') return JSON.stringify(strip(starterReading[0]), null, 2);
  if (kind === 'listening') return JSON.stringify(strip(starterListening[0]), null, 2);
  if (kind === 'writing') return JSON.stringify(strip(starterWriting[0]), null, 2);
  return JSON.stringify(strip(starterSpeaking[0]), null, 2);
}

function validateObjective(t: ObjectiveTest): string | null {
  if (!t.title) return 'Missing "title".';
  if (!Array.isArray(t.sections) || !t.sections.length) return 'Missing "sections".';
  const seen = new Set<number>();
  for (const s of t.sections) {
    if (!Array.isArray(s.groups)) return `Section "${s.title}" has no "groups".`;
    for (const g of s.groups) {
      if (!['gap', 'mcq', 'multi', 'tfng', 'ynng', 'match'].includes(g.type)) return `Unknown question type "${g.type}".`;
      if ((g.type === 'match' || g.type === 'multi') && !g.options?.length) return `Group "${g.title ?? g.id}" needs "options".`;
      for (const q of g.questions) {
        if (typeof q.number !== 'number') return 'Every question needs a numeric "number".';
        if (seen.has(q.number)) return `Question ${q.number} appears twice.`;
        seen.add(q.number);
        if (!Array.isArray(q.answer)) return `Question ${q.number} needs an "answer" array.`;
        if (g.type === 'mcq' && !q.options?.length) return `Question ${q.number} needs "options".`;
      }
    }
  }
  return null;
}

export default function ImportPage() {
  const [kind, setKind] = useState<Kind>('reading');
  const [json, setJson] = useState('');
  const [raw, setRaw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const tests = useStore(store.importedTests);
  const writing = useStore(store.importedWriting);
  const speaking = useStore(store.importedSpeaking);
  const hasKey = !!store.settings().apiKey;

  async function convert() {
    setBusy(true);
    setMsg(null);
    try {
      const out = await convertToTest(kind as 'reading' | 'listening', raw, template(kind));
      setJson(out);
      setMsg({ ok: true, text: 'Converted. Check the JSON below (especially the answers), then press Save.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function save() {
    setMsg(null);
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(json);
    } catch (e) {
      setMsg({ ok: false, text: `That isn't valid JSON: ${(e as Error).message}` });
      return;
    }
    const id = (data.id as string) || `imp-${uid()}`;
    if (kind === 'reading' || kind === 'listening') {
      const t = { durationMin: kind === 'reading' ? 60 : 30, variant: 'academic', ...data, id, skill: kind, source: 'imported' } as ObjectiveTest;
      const err = validateObjective(t);
      if (err) { setMsg({ ok: false, text: err }); return; }
      store.saveImportedTest(t);
    } else if (kind === 'writing') {
      const t = { variant: 'academic', ...data, id, source: 'imported' } as WritingTest;
      if (!t.title || !t.task1?.prompt || !t.task2?.prompt) { setMsg({ ok: false, text: 'Writing tests need "title", "task1.prompt" and "task2.prompt".' }); return; }
      store.saveImportedWriting(t);
    } else {
      const t = { ...data, id, source: 'imported' } as SpeakingTest;
      if (!t.title || !Array.isArray(t.part1) || !t.part2?.cue || !Array.isArray(t.part3)) { setMsg({ ok: false, text: 'Speaking tests need "title", "part1", "part2.cue" and "part3".' }); return; }
      store.saveImportedSpeaking(t);
    }
    setMsg({ ok: true, text: `Saved "${data.title as string}".` });
    setJson('');
    setRaw('');
  }

  async function onFile(f: File) {
    if (f.name.endsWith('.json')) setJson(await f.text());
    else setRaw(await f.text());
  }

  return (
    <div>
      <h1>Import tests</h1>
      <p className="muted">Add tests from material you own. Everything is stored only in this browser. Use Settings → Export to back it up.</p>

      <div className="tabs section">
        {(['reading', 'listening', 'writing', 'speaking'] as Kind[]).map((k) => (
          <button key={k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setMsg(null); }}>{k[0].toUpperCase() + k.slice(1)}</button>
        ))}
      </div>

      {msg && <div className={msg.ok ? 'notice' : 'error'} style={msg.ok ? { background: 'var(--good-soft)', color: 'var(--good)' } : undefined}>{msg.text}</div>}

      <div className="write-grid section">
        {(kind === 'reading' || kind === 'listening') && (
          <div className="card">
            <h3>1. Paste the test text (optional)</h3>
            <p className="small muted">Paste the {kind === 'reading' ? 'passage(s)' : 'transcript'}, the questions and the answer key. The AI turns it into the app's format for you. {!hasKey && 'Needs an API key in Settings.'}</p>
            <textarea rows={14} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={`${kind === 'reading' ? 'Passage' : 'Transcript'}…\n\nQuestions 1–5 …\n\nAnswer key: 1 TRUE 2 …`} />
            <div className="row" style={{ marginTop: 8 }}>
              <input type="file" accept=".txt,.json" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              <div className="spacer" />
              <button className="btn primary" disabled={!raw.trim() || !hasKey || busy} onClick={convert}>{busy ? 'Converting…' : 'Convert with AI →'}</button>
            </div>
          </div>
        )}
        <div className="card">
          <h3>{kind === 'reading' || kind === 'listening' ? '2. ' : ''}Test JSON</h3>
          <p className="small muted">Write it by hand from the template, or check what the converter produced.</p>
          <textarea rows={kind === 'reading' || kind === 'listening' ? 14 : 20} value={json} onChange={(e) => setJson(e.target.value)} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => setJson(template(kind))}>Load template</button>
            <div className="spacer" />
            <button className="btn primary" disabled={!json.trim()} onClick={save}>Save test</button>
          </div>
        </div>
      </div>

      {kind === 'listening' && <AudioAttach />}

      <div className="card section">
        <h3>Your imported tests</h3>
        {[...tests.map((t) => ({ id: t.id, title: t.title, k: t.skill, del: () => store.deleteImportedTest(t.id), raw: t })),
          ...writing.map((t) => ({ id: t.id, title: t.title, k: 'writing', del: () => store.deleteImportedWriting(t.id), raw: t })),
          ...speaking.map((t) => ({ id: t.id, title: t.title, k: 'speaking', del: () => store.deleteImportedSpeaking(t.id), raw: t }))].map((r) => (
          <div className="row" key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="pill">{r.k}</span> {r.title}
            <div className="spacer" />
            <button className="btn small" onClick={() => { setKind(r.k as Kind); setJson(JSON.stringify(r.raw, null, 2)); window.scrollTo(0, 0); }}>Edit</button>
            <button className="btn small danger" onClick={r.del}>Delete</button>
          </div>
        ))}
        {!tests.length && !writing.length && !speaking.length && <p className="muted small">Nothing imported yet.</p>}
      </div>
    </div>
  );
}

function AudioAttach() {
  const tests = useStore(store.importedTests).filter((t) => t.skill === 'listening');
  const [testId, setTestId] = useState('');
  const [msg, setMsg] = useState('');
  const t = tests.find((x) => x.id === testId) ?? tests[0];
  void allObjective;
  async function attach(sectionId: string, f: File) {
    if (!t) return;
    const key = `audio-${t.id}-${sectionId}`;
    await putBlob(key, f);
    store.saveImportedTest({ ...t, sections: t.sections.map((s) => (s.id === sectionId ? { ...s, audio: `idb:${key}` } : s)) });
    setMsg(`Attached ${f.name}.`);
  }
  if (!tests.length) return null;
  return (
    <div className="card section">
      <h3>Attach audio files</h3>
      <p className="small muted">Upload the recording for each part. Parts without audio are read aloud with text-to-speech from the transcript.</p>
      <select value={t?.id} onChange={(e) => setTestId(e.target.value)}>{tests.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
      {t?.sections.map((s) => (
        <div className="row" key={s.id} style={{ marginTop: 8 }}>
          <b style={{ width: 80 }}>{s.title}</b>
          {s.audio ? <span className="pill good">Audio attached</span> : <span className="pill">TTS</span>}
          <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && attach(s.id, e.target.files[0])} />
        </div>
      ))}
      {msg && <p className="small">{msg}</p>}
    </div>
  );
}
