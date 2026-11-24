import { useEffect, useState } from 'react';
import type { ObjectiveTest, SpeakingTest, WritingTest } from '../types';
import { store } from '../lib/storage';
import { starterReading } from './starterReading';
import { starterListening, starterSpeaking, starterWriting } from './starterOther';

export function allObjective(): ObjectiveTest[] {
  return [...starterListening, ...starterReading, ...store.importedTests()];
}
export function allWriting(): WritingTest[] {
  return [...starterWriting, ...store.importedWriting()];
}
export function allSpeaking(): SpeakingTest[] {
  return [...starterSpeaking, ...store.importedSpeaking()];
}

/** Re-renders whenever local data changes (attempts, settings, imports). */
export function useStore<T>(read: () => T): T {
  const [v, setV] = useState(read);
  useEffect(() => {
    const on = () => setV(read());
    window.addEventListener('ielts-store', on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener('ielts-store', on);
      window.removeEventListener('storage', on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
