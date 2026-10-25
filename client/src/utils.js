export const CATEGORIES = ['health', 'study', 'fitness', 'mindfulness', 'other'];

export const CATEGORY_LABELS = {
  health: 'Health',
  study: 'Study',
  fitness: 'Fitness',
  mindfulness: 'Mindfulness',
  other: 'Other',
};

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function checkInDateKey(checkIn) {
  return String(checkIn.date).slice(0, 10);
}

export function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

export function monthEndKey(date) {
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0));
}

export function calendarDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(date.getFullYear(), date.getMonth(), index - offset + 1, 12, 0, 0, 0);
    return { date: day, key: toDateKey(day), inMonth: day.getMonth() === date.getMonth() };
  });
}

export function startOfWeek(date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

export function formatLongDate(key) {
  return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'habit';
}
