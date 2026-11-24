import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allObjective, useStore } from '../data/catalog';
import { store } from '../lib/storage';
import { fmtBand } from '../lib/bands';

export default function Catalogue() {
  const { skill = 'reading' } = useParams();
  const attempts = useStore(store.attempts);
  const imported = useStore(store.importedTests); // re-render on import
  const [variant, setVariant] = useState<'all' | 'academic' | 'general'>('all');
  const [sort, setSort] = useState<'default' | 'alpha'>('default');
  void imported;

  let tests = allObjective().filter((t) => t.skill === skill && (variant === 'all' || t.variant === variant));
  if (sort === 'alpha') tests = [...tests].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  const groups = new Map<string, typeof tests>();
  for (const t of tests) {
    const k = t.collection || (t.source === 'starter' ? 'Starter tests' : 'My imported tests');
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }

  return (
    <div>
      <div className="row">
        <h1 style={{ textTransform: 'capitalize' }}>{skill} tests</h1>
        <div className="spacer" />
        <select value={variant} onChange={(e) => setVariant(e.target.value as typeof variant)}>
          <option value="all">Academic + General</option>
          <option value="academic">Academic</option>
          <option value="general">General Training</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="default">Default order</option>
          <option value="alpha">Alphabetical</option>
        </select>
        <Link className="btn" to="/import">+ Import a test</Link>
      </div>

      {tests.length === 0 && <p className="muted section">No tests here yet. Use “Import a test” to add your own.</p>}

      {[...groups.entries()].map(([name, list]) => (
        <div key={name} className="section">
          <h2>{name}</h2>
          <div className="grid c4">
            {list.map((t) => {
              const mine = attempts.filter((a) => a.testId === t.id);
              const best = mine.reduce<number | null>((m, a) => (a.band !== null && (m === null || a.band > m) ? a.band : m), null);
              const qCount = t.sections.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.questions.length, 0), 0);
              return (
                <div className="card" key={t.id}>
                  <div className="row small muted">
                    <span className="pill brand">{t.variant === 'academic' ? 'Academic' : 'General'}</span>
                    <span>{qCount} Qs · {t.durationMin} min</span>
                  </div>
                  <h3 style={{ margin: '10px 0' }}>{t.title}</h3>
                  <div className="row">
                    {best !== null ? <span className="pill good">Best {fmtBand(best)}</span> : <span className="pill">Not started</span>}
                    <div className="spacer" />
                    {mine[0] && <Link className="small" to={`/result/${mine[0].id}`}>Last result</Link>}
                  </div>
                  <Link className="btn primary small" style={{ marginTop: 12 }} to={`/test/${t.id}`}>{mine.length ? 'Retake' : 'Take test'} →</Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
