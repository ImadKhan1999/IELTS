import { useState } from 'react';
import { Link } from 'react-router-dom';
import { askTutor } from '../lib/ai';
import { store } from '../lib/storage';

type Msg = { role: 'user' | 'assistant'; content: string };

const STARTERS = [
  'How do I tell FALSE from NOT GIVEN?',
  'Give me a plan to go from band 6 to 7 in writing in 4 weeks.',
  'What are common mistakes in Writing Task 1 line graphs?',
  'Give me 10 useful linking phrases for Task 2 essays.',
];

export default function Tutor() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasKey = !!store.settings().apiKey;

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: text.trim() }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const reply = await askTutor(next);
      setMsgs([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="row"><h1>AI Tutor</h1><div className="spacer" /><button className="btn small" onClick={() => setMsgs([])}>Reset</button></div>
      {!hasKey && <div className="notice">Add your API key in <Link to="/settings">Settings</Link> to chat with the tutor.</div>}
      <div className="card section">
        <div className="chat">
          {msgs.length === 0 && (
            <div className="row">
              {STARTERS.map((s) => <button key={s} className="btn small" onClick={() => send(s)} disabled={!hasKey}>{s}</button>)}
            </div>
          )}
          {msgs.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.content}</div>)}
          {busy && <div className="bubble assistant muted">Thinking…</div>}
          {error && <div className="error">{error}</div>}
        </div>
        <form className="row" style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about IELTS, or paste an essay for feedback" style={{ flex: 1 }} disabled={!hasKey} />
          <button className="btn primary" disabled={!hasKey || busy}>Send</button>
        </form>
      </div>
    </div>
  );
}
