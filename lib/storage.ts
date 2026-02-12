import { Task } from '@/types';

const PIN_HASH_KEY = 'pinHash';
const TASKS_KEY = 'tasks';
const DEFAULT_SOUND_KEY = 'defaultSoundEnabled';

export const storage = {
  getPinHash: () => localStorage.getItem(PIN_HASH_KEY),
  setPinHash: (hash: string) => localStorage.setItem(PIN_HASH_KEY, hash),
  getTasks: (): Task[] => {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  },
  setTasks: (tasks: Task[]) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)),
  clearTasks: () => localStorage.removeItem(TASKS_KEY),
  getDefaultSoundEnabled: () => localStorage.getItem(DEFAULT_SOUND_KEY) !== 'false',
  setDefaultSoundEnabled: (enabled: boolean) =>
    localStorage.setItem(DEFAULT_SOUND_KEY, enabled ? 'true' : 'false'),
};

export async function sha256(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
