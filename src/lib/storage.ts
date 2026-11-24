import type { Attempt, ObjectiveTest, Settings, SpeakingTest, WritingTest } from '../types';

const K = {
  settings: 'ielts.settings',
  attempts: 'ielts.attempts',
  tests: 'ielts.importedTests',
  writing: 'ielts.importedWriting',
  speaking: 'ielts.importedSpeaking',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Could not save', key, e);
  }
  window.dispatchEvent(new Event('ielts-store'));
}

export const defaultSettings: Settings = { targetBand: 7, apiKey: '', theme: 'light', name: 'Student' };

export const store = {
  settings: (): Settings => ({ ...defaultSettings, ...read<Partial<Settings>>(K.settings, {}) }),
  saveSettings: (s: Settings) => write(K.settings, s),

  attempts: (): Attempt[] => read<Attempt[]>(K.attempts, []),
  saveAttempt: (a: Attempt) => {
    const all = store.attempts().filter((x) => x.id !== a.id);
    write(K.attempts, [a, ...all]);
  },
  deleteAttempt: (id: string) => write(K.attempts, store.attempts().filter((x) => x.id !== id)),

  importedTests: (): ObjectiveTest[] => read<ObjectiveTest[]>(K.tests, []),
  saveImportedTest: (t: ObjectiveTest) => write(K.tests, [...store.importedTests().filter((x) => x.id !== t.id), t]),
  deleteImportedTest: (id: string) => write(K.tests, store.importedTests().filter((x) => x.id !== id)),

  importedWriting: (): WritingTest[] => read<WritingTest[]>(K.writing, []),
  saveImportedWriting: (t: WritingTest) => write(K.writing, [...store.importedWriting().filter((x) => x.id !== t.id), t]),
  deleteImportedWriting: (id: string) => write(K.writing, store.importedWriting().filter((x) => x.id !== id)),

  importedSpeaking: (): SpeakingTest[] => read<SpeakingTest[]>(K.speaking, []),
  saveImportedSpeaking: (t: SpeakingTest) => write(K.speaking, [...store.importedSpeaking().filter((x) => x.id !== t.id), t]),
  deleteImportedSpeaking: (id: string) => write(K.speaking, store.importedSpeaking().filter((x) => x.id !== id)),

  exportAll: () => JSON.stringify({
    settings: { ...store.settings(), apiKey: '' },
    attempts: store.attempts(),
    tests: store.importedTests(),
    writing: store.importedWriting(),
    speaking: store.importedSpeaking(),
  }, null, 2),
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---------- IndexedDB blob store (audio files, recordings) ----------
const DB = 'ielts-blobs';
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('blobs');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function putBlob(key: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction('blobs', 'readwrite');
    tx.objectStore('blobs').put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function getBlob(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const req = db.transaction('blobs').objectStore('blobs').get(key);
    req.onsuccess = () => res(req.result as Blob | undefined);
    req.onerror = () => rej(req.error);
  });
}
/** Resolves "idb:<key>" to an object URL; passes other URLs through. */
export async function resolveAudio(src?: string): Promise<string | undefined> {
  if (!src) return undefined;
  if (!src.startsWith('idb:')) return src;
  const blob = await getBlob(src.slice(4));
  return blob ? URL.createObjectURL(blob) : undefined;
}
