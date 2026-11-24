import { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../lib/storage';
import { useStore } from '../data/catalog';
import { fmtBand, overallBand } from '../lib/bands';
import type { Attempt, Skill } from '../types';

const SKILLS: { key: Skill; label: string; icon: string; to: string }[] = [
  { key: 'listening', label: 'Listening', icon: '🎧', to: '/tests/listening' },
  { key: 'reading', label: 'Reading', icon: '📖', to: '/tests/reading' },
  { key: 'writing', label: 'Writing', icon: '✍️', to: '/writing' },
  { key: 'speaking', label: 'Speaking', icon: '🎤', to: '/speaking' },
];

function stats(list: Attempt[]) {
  const scored = list.filter((a) => a.band !== null);
  const bands = scored.map((a) => a.band as number);
  const obj = list.filter((a) => a.total);
  const acc = obj.length ? Math.round((obj.reduce((s, a) => s + (a.correct ?? 0), 0) / obj.reduce((s, a) => s + (a.total ?? 0), 0)) * 100) : null;
  return {
    count: list.length,
    avg: bands.length ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2 : null,
    best: bands.length ? Math.max(...bands) : null,
    acc,
  };
}

export default function Dashboard() {
  const settings = useStore(store.settings);
  const attempts = useStore(store.attempts);
  const [tab, setTab] = useState<'all' | Skill>('all');

  const bySkill = (s: Skill) => attempts.filter((a) => a.skill === s);
  const latest = Object.fromEntries(SKILLS.map((s) => [s.key, bySkill(s.key).find((a) => a.band !== null)?.band ?? null])) as Record<Skill, number | null>;
  const haveAll = SKILLS.every((s) => latest[s.key] !== null);
  const estimate = haveAll ? overallBand(SKILLS.map((s) => latest[s.key] as number)) : null;
  const all = stats(attempts);
  const shown = tab === 'all' ? attempts : bySkill(tab);

  return (
    <div>
      <div className="row">
        <div>
          <h1>Welcome back, {settings.name}</h1>
          <div className="muted">Keep going, every test moves you closer to your target.</div>
        </div>
        <div className="spacer" />
        <label className="row small">
          🎯 Target band
          <select value={settings.targetBand} onChange={(e) => store.saveSettings({ ...settings, targetBand: Number(e.target.value) })}>
            {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
          </select>
        </label>
      </div>

      <div className="grid c4 section">
        {SKILLS.map((s) => {
          const st = stats(bySkill(s.key));
          return (
            <div className="card" key={s.key}>
              <div className="row"><h3>{s.icon} {s.label}</h3><div className="spacer" />{st.acc !== null && <span className="pill">{st.acc}% acc</span>}</div>
              <div className="row" style={{ justifyContent: 'space-between', margin: '10px 0 14px' }}>
                <div className="stat"><span className="small muted">Average</span><b>{fmtBand(st.avg)}</b></div>
                <div className="stat"><span className="small muted">Best</span><b>{fmtBand(st.best)}</b></div>
                <div className="stat"><span className="small muted">Tests</span><b>{st.count}</b></div>
              </div>
              <Link className="btn primary small" to={s.to}>Practice now</Link>{' '}
              <button className="btn small" onClick={() => setTab(s.key)}>Results</button>
            </div>
          );
        })}
      </div>

      <div className="grid c3 section">
        <div className="card">
          <h3>Estimated overall band</h3>
          <div className="big">{fmtBand(estimate)}</div>
          <div className="small muted">
            {haveAll ? 'Based on your latest score in each skill.' : 'Complete at least one test in all four skills to see your estimate.'}
          </div>
          <div className="row small" style={{ marginTop: 10 }}>
            {SKILLS.map((s) => <span key={s.key} className="pill">{s.label[0]}: {fmtBand(latest[s.key])}</span>)}
          </div>
        </div>
        <div className="card">
          <h3>Overall analytics</h3>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <div className="stat"><span className="small muted">Tests taken</span><b>{all.count}</b></div>
            <div className="stat"><span className="small muted">Average band</span><b>{fmtBand(all.avg)}</b></div>
            <div className="stat"><span className="small muted">Personal best</span><b>{fmtBand(all.best)}</b></div>
          </div>
        </div>
        <div className="card">
          <h3>Gap to target</h3>
          <div className="big">{all.avg !== null ? (settings.targetBand - all.avg > 0 ? `+${(settings.targetBand - all.avg).toFixed(1)}` : 'On target ✓') : '–'}</div>
          <div className="small muted">Your average versus your {settings.targetBand.toFixed(1)} target.</div>
        </div>
      </div>

      <div className="card section">
        <h3>Progress</h3>
        <ProgressChart attempts={shown} target={settings.targetBand} />
      </div>

      <div className="card section">
        <div className="tabs">
          {(['all', 'listening', 'reading', 'writing', 'speaking'] as const).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'all' ? 'All results' : t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="muted">No attempts yet. Pick a skill above to take your first test.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Date</th><th>Test</th><th>Skill</th><th>Score</th><th>Band</th><th /></tr></thead>
              <tbody>
                {shown.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{a.skill}</td>
                    <td>{a.total ? `${a.correct}/${a.total}` : '–'}</td>
                    <td>{a.band === null ? <span className="pill warn">Pending</span> : <b>{fmtBand(a.band)}</b>}</td>
                    <td><Link to={`/result/${a.id}`}>View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressChart({ attempts, target }: { attempts: Attempt[]; target: number }) {
  const pts = attempts.filter((a) => a.band !== null).slice().reverse();
  if (pts.length < 2) return <p className="muted small">Take at least two scored tests to see your progress line.</p>;
  const W = 700, H = 200, pad = 30;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = (b: number) => H - pad - ((b - 3) / 6) * (H - pad * 2);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.band as number)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Band score over time">
      {[4, 5, 6, 7, 8, 9].map((b) => (
        <g key={b}>
          <line x1={pad} x2={W - pad} y1={y(b)} y2={y(b)} stroke="var(--border)" />
          <text x={4} y={y(b) + 4} fontSize="11" fill="var(--muted)">{b}</text>
        </g>
      ))}
      <line x1={pad} x2={W - pad} y1={y(target)} y2={y(target)} stroke="var(--good)" strokeDasharray="6 4" />
      <text x={W - pad} y={y(target) - 6} fontSize="11" fill="var(--good)" textAnchor="end">Target {target}</text>
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
      {pts.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.band as number)} r="4" fill="var(--brand)">
          <title>{`${p.title}: ${p.band}`}</title>
        </circle>
      ))}
    </svg>
  );
}
