import { toDateKey } from './utils.js';

const STORAGE_KEY = 'habithub.local-preview.v1';

const sampleHabits = [
  { id: 101, name: 'Drink water', description: 'Start the day hydrated.', category: 'health', frequency: 'daily', targetPerWeek: 7, tags: ['wellness', 'daily'], archived: false, slug: 'drink-water' },
  { id: 102, name: 'Morning run', description: 'A little movement before the world wakes up.', category: 'fitness', frequency: 'weekly', targetPerWeek: 4, tags: ['movement', 'outside'], archived: false, slug: 'morning-run' },
  { id: 103, name: 'Read 20 pages', description: 'Make room for one good idea.', category: 'study', frequency: 'daily', targetPerWeek: 5, tags: ['learning'], archived: false, slug: 'read-20-pages' },
  { id: 104, name: 'Meditate', description: 'Five quiet minutes, just for you.', category: 'mindfulness', frequency: 'daily', targetPerWeek: 7, tags: ['calm'], archived: false, slug: 'meditate' },
  { id: 105, name: 'Evening journal', description: 'Close the day with a small reflection.', category: 'other', frequency: 'daily', targetPerWeek: 5, tags: ['reflection'], archived: false, slug: 'evening-journal' },
];

function createSampleSnapshot() {
  const checkIns = [];
  const today = new Date();
  for (let offset = 0; offset < 100; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset, 12);
    sampleHabits.forEach((habit, index) => {
      const weeklySkip = offset % 7 > habit.targetPerWeek + (index % 2) - 1;
      const missed = (offset * 3 + index * 5) % 11 === 0;
      if (!weeklySkip && !missed) {
        checkIns.push({
          id: `demo-${habit.id}-${toDateKey(day)}`,
          habitId: habit.id,
          date: toDateKey(day),
          note: offset === 1 && index === 2 ? 'A few pages before bed.' : null,
        });
      }
    });
  }
  return { habits: sampleHabits, checkIns };
}

export function readDemoSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.habits) && Array.isArray(parsed.checkIns)) return parsed;
    }
  } catch {
    // A damaged local preview cache should not prevent the app from starting.
  }
  return createSampleSnapshot();
}

export function saveDemoSnapshot(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Keep the current browser session usable if storage is unavailable.
  }
}
