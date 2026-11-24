import { useEffect, useRef, useState } from 'react';
import { resolveAudio } from '../lib/storage';

interface Props {
  audio?: string;
  transcript?: string;
  mode: 'practice' | 'simulation';
  autoStart?: boolean;
}

/**
 * Plays a part's audio. Uses the uploaded/linked audio file when there is one, otherwise reads the
 * transcript aloud with the browser's speech synthesis (a different voice for each speaker).
 * Simulation mode: plays once, no controls. Practice mode: full controls.
 */
export default function ListeningAudio({ audio, transcript, mode, autoStart }: Props) {
  const [src, setSrc] = useState<string>();
  const [played, setPlayed] = useState(false);
  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'done'>('idle');
  const el = useRef<HTMLAudioElement>(null);
  const [vol, setVol] = useState(1);

  useEffect(() => {
    let url: string | undefined;
    resolveAudio(audio).then((u) => { url = u; setSrc(u); });
    return () => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); };
  }, [audio]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => { if (el.current) el.current.volume = vol; }, [vol]);

  function speak() {
    if (!transcript || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = synth.getVoices().filter((v) => v.lang.startsWith('en'));
    const speakers = new Map<string, SpeechSynthesisVoice | undefined>();
    const lines = transcript.split('\n').map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, i) => {
      const m = line.match(/^([^:]{1,30}):\s*(.*)$/);
      const who = m ? m[1] : 'Narrator';
      const text = m ? m[2] : line;
      if (!speakers.has(who)) speakers.set(who, voices.length ? voices[speakers.size % voices.length] : undefined);
      const u = new SpeechSynthesisUtterance(text);
      const v = speakers.get(who);
      if (v) u.voice = v;
      u.rate = 0.95;
      u.volume = vol;
      if (i === lines.length - 1) u.onend = () => setState('done');
      synth.speak(u);
    });
    setState('playing');
  }

  function play() {
    if (mode === 'simulation') {
      if (played) return;
      setPlayed(true);
    }
    if (src && el.current) {
      el.current.play();
      setState('playing');
    } else speak();
  }
  function pause() {
    if (src && el.current) el.current.pause();
    else window.speechSynthesis.pause();
    setState('paused');
  }
  function resume() {
    if (src && el.current) el.current.play();
    else window.speechSynthesis.resume();
    setState('playing');
  }
  function skip(sec: number) {
    if (el.current) el.current.currentTime = Math.max(0, el.current.currentTime + sec);
  }

  useEffect(() => {
    if (autoStart && state === 'idle' && (src || transcript)) {
      const t = setTimeout(play, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, src]);

  const hasAudio = !!src;
  return (
    <div className="audio-bar">
      {hasAudio && <audio ref={el} src={src} onEnded={() => setState('done')} />}
      {mode === 'simulation' ? (
        <>
          <button className="btn small primary" disabled={played} onClick={play}>{played ? (state === 'done' ? 'Audio finished' : '🔊 Playing…') : '▶ Play audio (once)'}</button>
        </>
      ) : (
        <>
          {state === 'playing' ? (
            <button className="btn small" onClick={pause}>⏸ Pause</button>
          ) : state === 'paused' ? (
            <button className="btn small" onClick={resume}>▶ Resume</button>
          ) : (
            <button className="btn small primary" onClick={play}>▶ {state === 'done' ? 'Replay' : 'Play'}</button>
          )}
          {hasAudio && <button className="btn small" onClick={() => skip(-5)}>« 5s</button>}
          {hasAudio && <button className="btn small" onClick={() => skip(5)}>5s »</button>}
          {!hasAudio && state !== 'idle' && <button className="btn small" onClick={() => { window.speechSynthesis.cancel(); setState('idle'); }}>⏹ Stop</button>}
          <input type="range" min={0} max={1} step={0.1} value={vol} onChange={(e) => setVol(Number(e.target.value))} aria-label="Volume" />
          {!hasAudio && <span className="small muted">Text-to-speech</span>}
        </>
      )}
    </div>
  );
}
