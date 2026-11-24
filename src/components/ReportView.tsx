import { useState } from 'react';
import type { AiReport } from '../types';
import { fmtBand } from '../lib/bands';

export default function ReportView({ report }: { report: AiReport }) {
  const [showModel, setShowModel] = useState(false);
  return (
    <div>
      <div className="row"><h3>AI examiner report</h3><div className="spacer" /><span className="pill brand">Band {fmtBand(report.overall)}</span></div>
      <p className="small">{report.summary}</p>
      {report.criteria.map((c) => (
        <div key={c.criterion} className="ans" style={{ background: 'var(--surface-2)' }}>
          <div className="row"><b>{c.criterion}</b><div className="spacer" /><span className="pill">Band {fmtBand(c.band)}</span></div>
          {c.strengths.length > 0 && (
            <>
              <div className="small" style={{ marginTop: 6, color: 'var(--good)' }}>Strengths</div>
              <ul className="small" style={{ margin: '4px 0' }}>{c.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
          {c.improvements.length > 0 && (
            <>
              <div className="small" style={{ color: 'var(--bad)' }}>Areas to improve</div>
              <ul className="small" style={{ margin: '4px 0' }}>{c.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
        </div>
      ))}
      {report.improvedVersion && (
        <>
          <button className="btn small" onClick={() => setShowModel((x) => !x)}>{showModel ? 'Hide' : 'Show'} model answer</button>
          {showModel && <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{report.improvedVersion}</p>}
        </>
      )}
    </div>
  );
}
