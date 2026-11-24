import { useState } from 'react';
import { store } from '../lib/storage';
import { useStore } from '../data/catalog';

export default function SettingsPage() {
  const settings = useStore(store.settings);
  const [key, setKey] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);

  function exportData() {
    const blob = new Blob([store.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ielts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  async function importData(f: File) {
    const d = JSON.parse(await f.text());
    if (d.attempts) localStorage.setItem('ielts.attempts', JSON.stringify(d.attempts));
    if (d.tests) localStorage.setItem('ielts.importedTests', JSON.stringify(d.tests));
    if (d.writing) localStorage.setItem('ielts.importedWriting', JSON.stringify(d.writing));
    if (d.speaking) localStorage.setItem('ielts.importedSpeaking', JSON.stringify(d.speaking));
    if (d.settings) store.saveSettings({ ...d.settings, apiKey: settings.apiKey });
    window.dispatchEvent(new Event('ielts-store'));
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Settings</h1>
      <div className="card section">
        <h3>Profile</h3>
        <label className="small muted">Your name</label>
        <input type="text" value={settings.name} onChange={(e) => store.saveSettings({ ...settings, name: e.target.value })} style={{ width: '100%' }} />
        <div className="row" style={{ marginTop: 12 }}>
          <span>Theme</span>
          <button className={`btn small ${settings.theme === 'light' ? 'primary' : ''}`} onClick={() => store.saveSettings({ ...settings, theme: 'light' })}>Light</button>
          <button className={`btn small ${settings.theme === 'dark' ? 'primary' : ''}`} onClick={() => store.saveSettings({ ...settings, theme: 'dark' })}>Dark</button>
        </div>
      </div>
      <div className="card section">
        <h3>AI marking</h3>
        <p className="small muted">Writing and Speaking marking, the AI tutor and the test converter use Claude through your own Anthropic API key. The key is saved only in this browser and sent only to Anthropic.</p>
        <input type="password" value={key} onChange={(e) => { setKey(e.target.value); setSaved(false); }} placeholder="sk-ant-…" style={{ width: '100%' }} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={() => { store.saveSettings({ ...settings, apiKey: key.trim() }); setSaved(true); }}>Save key</button>
          {saved && <span className="small" style={{ color: 'var(--good)' }}>Saved ✓</span>}
        </div>
      </div>
      <div className="card section">
        <h3>Backup</h3>
        <p className="small muted">Your results and imported tests live in this browser. Export a backup to move them to another device. Uploaded audio files aren't included.</p>
        <div className="row">
          <button className="btn" onClick={exportData}>Export backup</button>
          <label className="btn">Restore backup<input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} /></label>
        </div>
      </div>
    </div>
  );
}
