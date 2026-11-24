import { useState } from 'react';
import { fmtBand, overallBand, rawToBand } from '../lib/bands';

const BANDS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export default function Calculator() {
  const [b, setB] = useState({ l: 6.5, r: 6.5, w: 6, s: 6 });
  const [raw, setRaw] = useState(30);
  const [kind, setKind] = useState<'listening' | 'ac' | 'gt'>('listening');
  const conv = rawToBand(raw, 40, kind === 'listening' ? 'listening' : 'reading', kind === 'gt' ? 'general' : 'academic');
  return (
    <div>
      <h1>Band score calculator</h1>
      <div className="grid c3 section">
        <div className="card">
          <h3>Overall band</h3>
          {(['l', 'r', 'w', 's'] as const).map((k) => (
            <div className="row" key={k} style={{ marginBottom: 8 }}>
              <span style={{ width: 90 }}>{{ l: 'Listening', r: 'Reading', w: 'Writing', s: 'Speaking' }[k]}</span>
              <select value={b[k]} onChange={(e) => setB({ ...b, [k]: Number(e.target.value) })}>
                {BANDS.map((x) => <option key={x} value={x}>{x.toFixed(1)}</option>)}
              </select>
            </div>
          ))}
          <div className="big">{fmtBand(overallBand([b.l, b.r, b.w, b.s]))}</div>
          <p className="small muted">The average of the four skills, rounded to the nearest half band (an average ending in .25 rounds up to .5, and .75 rounds up to the next whole band).</p>
        </div>
        <div className="card">
          <h3>Raw score → band</h3>
          <div className="row">
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="listening">Listening</option>
              <option value="ac">Academic Reading</option>
              <option value="gt">General Training Reading</option>
            </select>
            <input type="number" min={0} max={40} value={raw} onChange={(e) => setRaw(Math.max(0, Math.min(40, Number(e.target.value))))} style={{ width: 80 }} /> / 40
          </div>
          <div className="big" style={{ marginTop: 12 }}>{fmtBand(conv)}</div>
          <p className="small muted">Approximate conversion based on published IELTS guidance. Official tables can vary slightly between test versions.</p>
        </div>
      </div>
    </div>
  );
}
