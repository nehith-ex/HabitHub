import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
  Leaf,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Target,
  TrendingUp,
  X,
  Brain,
  PenLine,
} from 'lucide-react';
import { api } from './api.js';
import { readDemoSnapshot, saveDemoSnapshot } from './demoStore.js';
import {
  calendarDays,
  CATEGORY_LABELS,
  checkInDateKey,
  dateFromKey,
  formatLongDate,
  formatMonth,
  monthEndKey,
  monthStart,
  slugify,
  startOfWeek,
  toDateKey,
} from './utils.js';
import './styles.css';

const CATEGORY_ICONS = {
  health: Heart,
  study: BookOpen,
  fitness: Dumbbell,
  mindfulness: Brain,
  other: Leaf,
};

const CATEGORY_COLORS = {
  health: 'rose',
  study: 'blue',
  fitness: 'orange',
  mindfulness: 'violet',
  other: 'green',
};

const todayKey = toDateKey(new Date());
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function normaliseCheckIns(items = []) {
  return items.map((item) => ({ ...item, date: checkInDateKey(item) }));
}

function shiftDateKey(key, offset) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

async function loadViewCheckIns(month) {
  const currentWeekEnd = startOfWeek(dateFromKey(todayKey));
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
  const [monthResult, recentResult] = await Promise.all([
    api.getCheckIns(toDateKey(month), monthEndKey(month)),
    api.getCheckIns(shiftDateKey(todayKey, -365), toDateKey(currentWeekEnd)),
  ]);
  const unique = new Map();
  [...(monthResult.data || []), ...(recentResult.data || [])].forEach((item) => {
    const date = checkInDateKey(item);
    unique.set(`${item.habitId}:${date}`, { ...item, date });
  });
  return [...unique.values()];
}

function isFutureDate(key) {
  return key > todayKey;
}

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem('habithub-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStreak(habitId, checkIns) {
  const dates = new Set(checkIns.filter((item) => item.habitId === habitId).map(checkInDateKey));
  let cursor = dateFromKey(todayKey);
  let streak = 0;
  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function IconTile({ category, children }) {
  const Icon = CATEGORY_ICONS[category] || Leaf;
  return (
    <div className={`category-icon ${CATEGORY_COLORS[category] || 'green'}`}>
      {children || <Icon size={18} strokeWidth={1.8} />}
    </div>
  );
}

function ProgressRing({ value }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="progress-ring" aria-label={`${value}% completed`}>
      <svg viewBox="0 0 108 108" role="img">
        <circle className="ring-track" cx="54" cy="54" r={radius} />
        <circle
          className="ring-value"
          cx="54"
          cy="54"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-copy"><strong>{value}%</strong><span>done</span></div>
    </div>
  );
}

function CalendarGrid({
  month,
  checkIns,
  selectedDate,
  onSelect,
  onMonthChange,
  compact = false,
}) {
  const days = calendarDays(month);
  const counts = checkIns.reduce((all, item) => {
    const key = checkInDateKey(item);
    all[key] = (all[key] || 0) + 1;
    return all;
  }, {});

  return (
    <div className={`calendar-grid-wrap ${compact ? 'compact' : ''}`}>
      <div className="calendar-month-head">
        <div>
          <span className="calendar-overline">YOUR CALENDAR</span>
          <h3>{formatMonth(month)}</h3>
        </div>
        <div className="month-arrows">
          <button className="icon-button" type="button" aria-label="Previous month" onClick={() => onMonthChange(-1)}>
            <ChevronLeft size={17} />
          </button>
          <button className="icon-button" type="button" aria-label="Next month" onClick={() => onMonthChange(1)}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day.slice(0, 1)}</span>)}
      </div>
      <div className="calendar-days">
        {days.map(({ date, key, inMonth }) => {
          const count = counts[key] || 0;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              className={[
                'calendar-day',
                inMonth ? '' : 'outside-month',
                selectedDate === key ? 'selected' : '',
                isToday ? 'today' : '',
                count ? 'has-checkins' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(key)}
              aria-label={`${formatLongDate(key)}${count ? `, ${count} completed` : ''}`}
            >
              <span>{date.getDate()}</span>
              {count > 0 && <i className="day-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend"><span className="legend-dot" /> Completed habits</div>
    </div>
  );
}

function WeekStrip({ selectedDate, onSelect, checkIns }) {
  const week = useMemo(() => {
    const start = startOfWeek(dateFromKey(selectedDate));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { key: toDateKey(date), date };
    });
  }, [selectedDate]);

  const counts = checkIns.reduce((all, item) => {
    const key = checkInDateKey(item);
    all[key] = (all[key] || 0) + 1;
    return all;
  }, {});

  return (
    <div className="week-strip">
      {week.map(({ key, date }) => (
        <button
          type="button"
          key={key}
          className={`week-day ${selectedDate === key ? 'active' : ''} ${key === todayKey ? 'is-today' : ''}`}
          onClick={() => onSelect(key)}
        >
          <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
          <strong>{date.getDate()}</strong>
          <i className={counts[key] ? 'week-dot filled' : 'week-dot'} />
        </button>
      ))}
    </div>
  );
}

function HabitRow({
  habit,
  date,
  completed,
  checkIn,
  streak,
  onToggle,
  onEdit,
  onArchive,
  onNote,
  disabled,
}) {
  const Icon = CATEGORY_ICONS[habit.category] || Leaf;
  return (
    <article className={`habit-row ${completed ? 'completed' : ''}`}>
      <IconTile category={habit.category}><Icon size={19} strokeWidth={1.8} /></IconTile>
      <div className="habit-copy">
        <div className="habit-title-line">
          <h3>{habit.name}</h3>
          {completed && <span className="done-label"><Check size={12} /> Done</span>}
        </div>
        <p>{habit.description || `${CATEGORY_LABELS[habit.category] || 'Habit'} · ${habit.frequency === 'weekly' ? `${habit.targetPerWeek}× per week` : 'Daily'}`}</p>
        <div className="habit-meta">
          <span className={`category-label ${CATEGORY_COLORS[habit.category] || 'green'}`}>{CATEGORY_LABELS[habit.category] || 'Other'}</span>
          {streak > 0 && <span className="streak-label"><Flame size={12} /> {streak} day{streak === 1 ? '' : 's'}</span>}
          {habit.tags?.slice(0, 2).map((tag) => <span className="tag-label" key={tag}>#{tag}</span>)}
        </div>
      </div>
      <div className="habit-actions">
        <button className={`icon-button note-action ${checkIn?.note ? 'has-note' : ''}`} type="button" onClick={() => onNote(habit)} disabled={disabled || isFutureDate(date) || habit.archived} aria-label={checkIn?.note ? 'Edit check-in note' : 'Add a check-in note'} title={checkIn?.note ? 'Edit note' : 'Add note'}>
          <PenLine size={15} />
        </button>
        <button className="icon-button edit-action" type="button" onClick={() => onEdit(habit)} aria-label="Edit habit" title="Edit habit">
          <Pencil size={15} />
        </button>
        <button className="icon-button archive-action" type="button" onClick={() => onArchive(habit)} aria-label={habit.archived ? 'Restore habit' : 'Archive habit'} title={habit.archived ? 'Restore habit' : 'Archive habit'}>
          {habit.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
        </button>
        <button
          className={`check-button ${completed ? 'checked' : ''}`}
          type="button"
          aria-label={completed ? `Unmark ${habit.name} complete` : `Mark ${habit.name} complete`}
          onClick={() => onToggle(habit)}
          disabled={disabled || isFutureDate(date) || habit.archived}
        >
          {completed ? <Check size={18} strokeWidth={2.6} /> : <span />}
        </button>
      </div>
    </article>
  );
}

function HabitDialog({ habit, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    name: habit?.name || '',
    description: habit?.description || '',
    category: habit?.category || 'health',
    frequency: habit?.frequency || 'daily',
    targetPerWeek: habit?.targetPerWeek || 5,
    tags: (habit?.tags || []).join(', '),
  }));
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 3 || name.length > 60) {
      setError('Give your habit a name between 3 and 60 characters.');
      return;
    }
    setError('');
    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
    await onSave({
      name,
      description: form.description.trim() || null,
      category: form.category,
      frequency: form.frequency,
      targetPerWeek: form.frequency === 'daily' ? 7 : Number(form.targetPerWeek),
      tags,
    }, habit);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog habit-dialog" role="dialog" aria-modal="true" aria-labelledby="habit-dialog-title">
        <div className="dialog-topline"><span className="dialog-kicker">HABIT DETAILS</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="dialog-heading">
          <div className="dialog-mark"><Plus size={20} /></div>
          <div><h2 id="habit-dialog-title">{habit ? 'Edit habit' : 'Add a habit'}</h2><p>Choose a name, category, and schedule.</p></div>
        </div>
        <form onSubmit={submit} className="habit-form">
          <label className="field-label">Habit name <span>required</span><input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Take a mindful walk" maxLength={60} /></label>
          <label className="field-label">Description <span>optional</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Optional details about this habit" maxLength={200} rows={2} /></label>
          <div className="form-row">
            <label className="field-label">Category<select value={form.category} onChange={(event) => update('category', event.target.value)}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="field-label">Rhythm<select value={form.frequency} onChange={(event) => update('frequency', event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly target</option></select></label>
          </div>
          {form.frequency === 'weekly' && <label className="field-label">Weekly target <span>{form.targetPerWeek} days</span><input type="range" min="1" max="7" value={form.targetPerWeek} onChange={(event) => update('targetPerWeek', event.target.value)} className="range-input" /></label>}
          <label className="field-label">Tags <span>up to 5, separated by commas</span><input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="wellness, morning" /></label>
          {error && <p className="form-error">{error}</p>}
          <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : habit ? 'Save changes' : 'Add this habit'}<ArrowRight size={15} /></button></div>
        </form>
      </section>
    </div>
  );
}

function NoteDialog({ habit, checkIn, date, onClose, onSave, saving }) {
  const [note, setNote] = useState(checkIn?.note || '');
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title">
        <div className="dialog-topline"><span className="dialog-kicker">CHECK-IN NOTE</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="dialog-heading">
          <div className="dialog-mark note-mark"><PenLine size={19} /></div>
          <div><h2 id="note-dialog-title">{checkIn?.note ? 'Edit note' : 'Add a note'}</h2><p>{habit.name} · {formatLongDate(date)}</p></div>
        </div>
        <label className="field-label">Note<textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={4} placeholder="Add a short note about this check-in" /></label>
        <p className="note-hint">Saving this note also marks the habit complete for that day.</p>
        <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="button" className="button button-primary" onClick={() => onSave(note)} disabled={saving}>{saving ? 'Saving…' : 'Save reflection'}<ArrowRight size={15} /></button></div>
      </section>
    </div>
  );
}

function App() {
  const initialSnapshot = useMemo(() => readDemoSnapshot(), []);
  const [habits, setHabits] = useState(initialSnapshot.habits);
  const [checkIns, setCheckIns] = useState(initialSnapshot.checkIns);
  const [connection, setConnection] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [displayMonth, setDisplayMonth] = useState(() => monthStart(new Date()));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [habitDialog, setHabitDialog] = useState(undefined);
  const [noteHabit, setNoteHabit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c1420' : '#f5f7fa');
    try {
      window.localStorage.setItem('habithub-theme', theme);
    } catch {}
  }, [theme]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(''), 3000);
  }, []);

  const saveOfflineSnapshot = useCallback((nextHabits, nextCheckIns) => {
    saveDemoSnapshot({ habits: nextHabits, checkIns: nextCheckIns });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getHabits({ archived: showArchived }),
      loadViewCheckIns(displayMonth),
    ]).then(([habitResult, checkInList]) => {
      if (!active) return;
      setHabits(habitResult.data || []);
      setCheckIns(checkInList);
      setConnection('online');
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      const snapshot = readDemoSnapshot();
      setHabits(snapshot.habits);
      setCheckIns(snapshot.checkIns);
      setConnection('offline');
      setLoading(false);
    });
    return () => { active = false; };
  }, [showArchived, displayMonth]);

  const allCurrentHabits = useMemo(() => habits.filter((habit) => Boolean(habit.archived) === showArchived), [habits, showArchived]);
  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);
  const filteredHabits = useMemo(() => allCurrentHabits.filter((habit) => {
    const matchesCategory = categoryFilter === 'all' || habit.category === categoryFilter;
    const matchesSearch = !search || `${habit.name} ${habit.description || ''} ${(habit.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [allCurrentHabits, categoryFilter, search]);

  const checkInFor = useCallback((habitId, date) => checkIns.find((item) => item.habitId === habitId && checkInDateKey(item) === date), [checkIns]);
  const selectedCompletions = checkIns.filter((item) => checkInDateKey(item) === selectedDate).length;
  const todayCompleted = checkIns.filter((item) => checkInDateKey(item) === todayKey && activeHabits.some((habit) => habit.id === item.habitId)).length;
  const todayPercent = activeHabits.length ? Math.round((todayCompleted / activeHabits.length) * 100) : 0;

  const weekStats = useMemo(() => {
    const start = startOfWeek(dateFromKey(todayKey));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fromKey = toDateKey(start);
    const toKey = toDateKey(end);
    const weekCount = checkIns.filter((item) => {
      const key = checkInDateKey(item);
      return key >= fromKey && key <= toKey;
    }).length;
    const possible = Math.max(1, activeHabits.reduce((sum, habit) => sum + (habit.frequency === 'weekly' ? habit.targetPerWeek : 7), 0));
    return Math.min(100, Math.round((weekCount / possible) * 100));
  }, [checkIns, activeHabits]);

  function changeMonth(direction) {
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + direction, 1, 12);
    setDisplayMonth(next);
    setSelectedDate(toDateKey(next));
  }

  function selectCalendarDate(key) {
    setSelectedDate(key);
    const date = dateFromKey(key);
    if (date.getMonth() !== displayMonth.getMonth() || date.getFullYear() !== displayMonth.getFullYear()) {
      setDisplayMonth(monthStart(date));
    }
  }

  function updateOfflineHabits(updater) {
    setHabits((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveOfflineSnapshot(next, checkIns);
      return next;
    });
  }

  function updateOfflineCheckIns(updater) {
    setCheckIns((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveOfflineSnapshot(habits, next);
      return next;
    });
  }

  async function saveHabit(payload, originalHabit) {
    setSaving(true);
    try {
      if (connection === 'online') {
        const result = originalHabit
          ? await api.updateHabit(originalHabit.id, payload)
          : await api.createHabit(payload);
        const saved = result.data;
        setHabits((current) => {
          const without = current.filter((item) => item.id !== saved.id);
          return Boolean(saved.archived) === showArchived ? [saved, ...without] : without;
        });
        if (!originalHabit) setShowArchived(false);
        setHabitDialog(undefined);
        showToast(originalHabit ? 'Habit updated.' : 'Habit added.');
      } else {
        const saved = originalHabit
          ? { ...originalHabit, ...payload, slug: payload.name ? slugify(payload.name) : originalHabit.slug }
          : { id: `local-${Date.now()}`, ...payload, archived: false, slug: slugify(payload.name), createdAt: new Date().toISOString() };
        updateOfflineHabits((current) => originalHabit
          ? current.map((item) => item.id === originalHabit.id ? saved : item)
          : [saved, ...current]);
        if (!originalHabit) setShowArchived(false);
        setHabitDialog(undefined);
        showToast(originalHabit ? 'Habit updated in this browser.' : 'Habit added in this browser.');
      }
    } catch (error) {
      if (error.name === 'TypeError') {
        setConnection('offline');
        const saved = originalHabit
          ? { ...originalHabit, ...payload, slug: payload.name ? slugify(payload.name) : originalHabit.slug }
          : { id: `local-${Date.now()}`, ...payload, archived: false, slug: slugify(payload.name), createdAt: new Date().toISOString() };
        updateOfflineHabits((current) => originalHabit
          ? current.map((item) => item.id === originalHabit.id ? saved : item)
          : [saved, ...current]);
        if (!originalHabit) setShowArchived(false);
        setHabitDialog(undefined);
        showToast('API unavailable — saved in this browser only.');
      } else {
        showToast(error.message || 'Could not save this habit.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function archiveHabit(habit) {
    const archived = !habit.archived;
    if (connection === 'online') {
      try {
        const result = await api.updateHabit(habit.id, { archived });
        const saved = result.data;
        setHabits((current) => current.filter((item) => item.id !== saved.id));
        showToast(archived ? 'Habit archived.' : 'Habit restored.');
        return;
      } catch (error) {
        if (error.name !== 'TypeError') {
          showToast(error.message || 'Could not update this habit.');
          return;
        }
        setConnection('offline');
      }
    }
    updateOfflineHabits((current) => current.map((item) => item.id === habit.id ? { ...item, archived } : item));
    showToast(archived ? 'Habit archived in this browser.' : 'Habit restored in this browser.');
  }

  async function toggleCheckIn(habit) {
    const existing = checkInFor(habit.id, selectedDate);
    if (connection === 'online') {
      try {
        if (existing) {
          await api.removeCheckIn(habit.id, selectedDate);
          setCheckIns((current) => current.filter((item) => !(item.habitId === habit.id && checkInDateKey(item) === selectedDate)));
          showToast('Check-in removed.');
        } else {
          const result = await api.upsertCheckIn(habit.id, selectedDate, null);
          const saved = { ...result.data, date: checkInDateKey(result.data) };
          setCheckIns((current) => [...current.filter((item) => !(item.habitId === habit.id && checkInDateKey(item) === selectedDate)), saved]);
          showToast('Check-in saved.');
        }
        return;
      } catch (error) {
        if (error.name !== 'TypeError') {
          showToast(error.message || 'Could not save your check-in.');
          return;
        }
        setConnection('offline');
      }
    }
    updateOfflineCheckIns((current) => existing
      ? current.filter((item) => !(item.habitId === habit.id && checkInDateKey(item) === selectedDate))
      : [...current, { id: `local-${Date.now()}`, habitId: habit.id, date: selectedDate, note: null }]);
    showToast('Saved in this browser only while the API is offline.');
  }

  async function saveNote(noteText) {
    const cleanNote = noteText.trim();
    const existing = checkInFor(noteHabit.id, selectedDate);
    if (!cleanNote && !existing) {
      setNoteHabit(null);
      return;
    }
    setSaving(true);
    if (connection === 'online') {
      try {
        const result = await api.upsertCheckIn(noteHabit.id, selectedDate, cleanNote || null);
        const saved = { ...result.data, date: checkInDateKey(result.data) };
        setCheckIns((current) => [...current.filter((item) => !(item.habitId === noteHabit.id && checkInDateKey(item) === selectedDate)), saved]);
        setNoteHabit(null);
        showToast('Reflection saved with your check-in.');
        setSaving(false);
        return;
      } catch (error) {
        if (error.name !== 'TypeError') {
          showToast(error.message || 'Could not save your note.');
          setSaving(false);
          return;
        }
        setConnection('offline');
      }
    }
    updateOfflineCheckIns((current) => {
      const rest = current.filter((item) => !(item.habitId === noteHabit.id && checkInDateKey(item) === selectedDate));
      return [...rest, { ...(existing || {}), id: existing?.id || `local-${Date.now()}`, habitId: noteHabit.id, date: selectedDate, note: cleanNote || null }];
    });
    setNoteHabit(null);
    setSaving(false);
    showToast('Reflection saved in this browser only.');
  }

  const statusText = connection === 'online' ? 'API connected' : connection === 'checking' ? 'Connecting…' : 'Local preview';
  const isCalendarView = view === 'calendar';

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-symbol"><span /><span /><span /><span /></div>
          <span className="brand-name">habit<span>hub</span><i>.</i></span>
          <button className="mobile-close icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} type="button" onClick={() => { setView('overview'); setMobileMenuOpen(false); }}>
            <BarChart3 size={18} /><span>Overview</span><i className="nav-indicator" />
          </button>
          <button className={`nav-item ${view === 'calendar' ? 'active' : ''}`} type="button" onClick={() => { setView('calendar'); setMobileMenuOpen(false); }}>
            <CalendarDays size={18} /><span>Calendar</span><i className="nav-indicator" />
          </button>
        </nav>

        <div className="sidebar-divider" />
        <div className="side-section-heading"><span className="side-label">CATEGORIES</span><span className="tiny-count">{activeHabits.length}</span></div>
        <nav className="category-nav" aria-label="Habit categories">
          <button className={`category-nav-item ${categoryFilter === 'all' ? 'selected' : ''}`} type="button" onClick={() => { setCategoryFilter('all'); setView('overview'); }}><span className="category-bullet all-bullet"><Activity size={12} /></span><span>All habits</span><b>{activeHabits.length}</b></button>
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
            const Icon = CATEGORY_ICONS[category];
            const count = activeHabits.filter((habit) => habit.category === category).length;
            return <button className={`category-nav-item ${categoryFilter === category ? 'selected' : ''}`} type="button" key={category} onClick={() => { setCategoryFilter(category); setView('overview'); }}><span className={`category-bullet ${CATEGORY_COLORS[category]}`}><Icon size={12} /></span><span>{label}</span><b>{count}</b></button>;
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="streak-card">
          <div className="streak-card-top"><span>WEEKLY PROGRESS</span></div>
          <strong>{weekStats}%</strong>
          <p>of your weekly habit targets completed.</p>
          <div className="streak-progress"><span style={{ width: `${weekStats}%` }} /></div>
        </div>
        <button className="archive-switch" type="button" onClick={() => { setShowArchived((value) => !value); setCategoryFilter('all'); setView('overview'); }}>
          {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          <span>{showArchived ? 'Back to active habits' : 'View archive'}</span>
          <ChevronRight size={14} />
        </button>
        <div className="sidebar-footer"><span className="avatar-dot">M</span><span><strong>My space</strong><small>Demo account</small></span><ChevronDown size={15} /></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumb"><span>MY SPACE</span><span className="breadcrumb-slash">/</span><strong>{isCalendarView ? 'CALENDAR' : showArchived ? 'ARCHIVE' : 'OVERVIEW'}</strong></div>
          <div className="topbar-actions">
            <div className={`connection-pill ${connection}`}><span className="connection-dot" />{statusText}</div>
            <div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a habit…" aria-label="Search habits" /><kbd>⌘ K</kbd></div>
            <button className="icon-button theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="button button-primary add-button" type="button" onClick={() => setHabitDialog(null)}><Plus size={17} /> <span>New habit</span></button>
          </div>
        </header>

        <div className="page-content">
          {connection === 'offline' && <div className="offline-banner"><span className="offline-spark"><Activity size={14} /></span><span><strong>Local preview.</strong> The API is offline, so changes are saved in this browser only.</span><button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
          {isCalendarView ? (
            <CalendarPage
              month={displayMonth}
              checkIns={checkIns}
              selectedDate={selectedDate}
              habits={filteredHabits}
              showArchived={showArchived}
              categoryFilter={categoryFilter}
              onSelect={selectCalendarDate}
              onMonthChange={changeMonth}
              onToggle={toggleCheckIn}
              onEdit={(habit) => setHabitDialog(habit)}
              onArchive={archiveHabit}
              onNote={(habit) => setNoteHabit(habit)}
              checkInFor={checkInFor}
              streakFor={(id) => getStreak(id, checkIns)}
              disabled={loading}
            />
          ) : (
            <OverviewPage
              habits={filteredHabits}
              allHabits={allCurrentHabits}
              activeHabits={activeHabits}
              checkIns={checkIns}
              selectedDate={selectedDate}
              displayMonth={displayMonth}
              selectedCompletions={selectedCompletions}
              todayPercent={todayPercent}
              todayCompleted={todayCompleted}
              weekStats={weekStats}
              categoryFilter={categoryFilter}
              showArchived={showArchived}
              loading={loading}
              onSelectDate={selectCalendarDate}
              onMonthChange={changeMonth}
              onOpenCalendar={() => setView('calendar')}
              onToggle={toggleCheckIn}
              onEdit={(habit) => setHabitDialog(habit)}
              onArchive={archiveHabit}
              onNote={(habit) => setNoteHabit(habit)}
              checkInFor={checkInFor}
              streakFor={(id) => getStreak(id, checkIns)}
              onAdd={() => setHabitDialog(null)}
            />
          )}
        </div>
      </main>

      {habitDialog !== undefined && <HabitDialog habit={habitDialog} onClose={() => setHabitDialog(undefined)} onSave={saveHabit} saving={saving} />}
      {noteHabit && <NoteDialog key={`${noteHabit.id}-${selectedDate}`} habit={noteHabit} checkIn={checkInFor(noteHabit.id, selectedDate)} date={selectedDate} onClose={() => setNoteHabit(null)} onSave={saveNote} saving={saving} />}
      {toast && <div className="toast-message" role="status"><span><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

function OverviewPage({
  habits,
  allHabits,
  activeHabits,
  checkIns,
  selectedDate,
  displayMonth,
  selectedCompletions,
  todayPercent,
  todayCompleted,
  weekStats,
  categoryFilter,
  showArchived,
  loading,
  onSelectDate,
  onMonthChange,
  onOpenCalendar,
  onToggle,
  onEdit,
  onArchive,
  onNote,
  checkInFor,
  streakFor,
  onAdd,
}) {
  const isToday = selectedDate === todayKey;
  const titleDate = isToday ? 'today' : formatLongDate(selectedDate).toLowerCase();
  const dailyHabits = habits;

  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> HABIT TRACKER</div>
          <h1>{isToday ? 'Today at a glance' : 'Habit overview'}</h1>
          <p className="welcome-subtitle">Track your habits and review your daily progress.</p>
        </div>
        <div className="date-stamp"><span className="date-stamp-icon"><CalendarDays size={17} /></span><span><small>SELECTED DATE</small><strong>{formatLongDate(selectedDate)}</strong></span></div>
      </section>

      <section className="overview-grid">
        <div className="primary-column">
          <div className="hero-card">
            <div className="hero-content">
              <div className="hero-copy">
                <div className="hero-label"><span className="hero-label-dot" /> DAILY PROGRESS</div>
                <h2>{isToday ? 'Today’s completion' : 'Selected-day completion'}</h2>
                <p>{isToday ? `${todayCompleted} of ${activeHabits.length} habits complete today.` : `${selectedCompletions} of ${activeHabits.length} habits complete on ${titleDate}.`}</p>
                <button className="hero-link" type="button" onClick={onOpenCalendar}>View calendar <ArrowRight size={15} /></button>
              </div>
              <div className="hero-progress"><ProgressRing value={isToday ? todayPercent : Math.min(100, Math.round((selectedCompletions / Math.max(1, activeHabits.length)) * 100))} /><div><strong>{isToday ? todayCompleted : selectedCompletions}<span> / {activeHabits.length}</span></strong><small>habits complete</small></div></div>
            </div>
          </div>

          <div className="section-header habits-heading">
            <div><div className="section-overline">HABITS</div><h2>{showArchived ? 'Archived habits' : isToday ? 'Today’s habits' : 'Your habits'}<span className="count-chip">{dailyHabits.length}</span></h2><p>{isToday ? 'Mark each habit as you complete it.' : `Habits for ${titleDate}.`}</p></div>
            <button className="text-button" type="button" onClick={onOpenCalendar}>Open calendar <ArrowRight size={15} /></button>
          </div>

          <WeekStrip selectedDate={selectedDate} onSelect={onSelectDate} checkIns={checkIns} />

          <div className="habit-list">
            {dailyHabits.map((habit) => {
              const record = checkInFor(habit.id, selectedDate);
              return <HabitRow
                key={habit.id}
                habit={habit}
                date={selectedDate}
                completed={Boolean(record)}
                checkIn={record}
                streak={streakFor(habit.id)}
                onToggle={onToggle}
                onEdit={onEdit}
                onArchive={onArchive}
                onNote={onNote}
                disabled={loading}
              />;
            })}
            {!loading && dailyHabits.length === 0 && (
              <div className="empty-state"><div className="empty-mark"><Target size={22} /></div><h3>{categoryFilter === 'all' ? (showArchived ? 'No archived habits' : 'No habits yet') : 'No habits in this category'}</h3><p>{categoryFilter === 'all' ? (showArchived ? 'Archived habits will appear here.' : 'Add a habit to start tracking.') : 'Try another category or add a habit here.'}</p>{!showArchived && <button className="button button-primary" type="button" onClick={onAdd}><Plus size={16} /> Add your first habit</button>}</div>
            )}
          </div>

        </div>

        <aside className="secondary-column">
          <div className="side-panel calendar-panel">
            <CalendarGrid month={displayMonth} checkIns={checkIns} selectedDate={selectedDate} onSelect={onSelectDate} onMonthChange={onMonthChange} compact />
            <button className="calendar-open-link" type="button" onClick={onOpenCalendar}>Open full calendar <ArrowRight size={14} /></button>
          </div>

          <div className="side-panel snapshot-panel">
            <div className="panel-topline"><div><span className="section-overline">THIS WEEK</span><h3>Weekly progress</h3></div><div className="panel-icon"><TrendingUp size={17} /></div></div>
            <div className="snapshot-stats"><div><strong>{weekStats}<small>%</small></strong><span>weekly targets</span></div><div className="snapshot-divider" /><div><strong>{todayCompleted}<small>/{activeHabits.length}</small></strong><span>complete today</span></div></div>
            <div className="snapshot-track"><span style={{ width: `${weekStats}%` }} /></div>
            <p className="snapshot-caption">Completion across your weekly habit targets.</p>
          </div>
        </aside>
      </section>
    </>
  );
}

function CalendarPage({
  month,
  checkIns,
  selectedDate,
  habits,
  showArchived,
  categoryFilter,
  onSelect,
  onMonthChange,
  onToggle,
  onEdit,
  onArchive,
  onNote,
  checkInFor,
  streakFor,
  disabled,
}) {
  const selectedEntries = habits.filter((habit) => Boolean(checkInFor(habit.id, selectedDate)));
  const count = selectedEntries.length;
  const monthCount = checkIns.filter((item) => checkInDateKey(item).startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`)).length;
  const activeCount = habits.filter((habit) => !habit.archived).length;
  const weekdayName = dateFromKey(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <>
      <section className="welcome-row calendar-welcome">
        <div><div className="eyebrow"><span className="eyebrow-line" /> HABIT HISTORY</div><h1>Calendar</h1><p className="welcome-subtitle">Review your habit completions by date.</p></div>
        <div className="calendar-summary-pill"><div className="summary-icon"><CheckCircle2 size={18} /></div><span><small>THIS MONTH</small><strong>{monthCount} check-ins</strong></span></div>
      </section>
      <section className="calendar-page-grid">
        <div className="side-panel calendar-large-panel"><CalendarGrid month={month} checkIns={checkIns} selectedDate={selectedDate} onSelect={onSelect} onMonthChange={onMonthChange} /></div>
        <aside className="calendar-day-panel">
          <div className="selected-date-card"><span className="section-overline">YOUR SELECTED DAY</span><div className="selected-date-big"><strong>{dateFromKey(selectedDate).getDate()}</strong><span>{dateFromKey(selectedDate).toLocaleDateString('en-US', { month: 'short' })}</span></div><h2>{weekdayName}</h2><p>{formatLongDate(selectedDate)}</p><div className="selected-progress"><div className="selected-progress-copy"><span>Daily progress</span><strong>{count}<small> / {activeCount}</small></strong></div><div className="selected-progress-track"><span style={{ width: `${activeCount ? Math.min(100, count / activeCount * 100) : 0}%` }} /></div></div></div>
          <div className="day-habits-heading"><div><span className="section-overline">YOUR RITUALS</span><h3>{showArchived ? 'Archived habits' : 'For this day'}</h3></div><span className="count-chip">{habits.length}</span></div>
          <div className="day-habits-list">
            {habits.map((habit) => {
              const record = checkInFor(habit.id, selectedDate);
              return <HabitRow key={habit.id} habit={habit} date={selectedDate} completed={Boolean(record)} checkIn={record} streak={streakFor(habit.id)} onToggle={onToggle} onEdit={onEdit} onArchive={onArchive} onNote={onNote} disabled={disabled} />;
            })}
            {!habits.length && <div className="empty-state compact-empty"><div className="empty-mark"><Target size={20} /></div><h3>{categoryFilter === 'all' ? 'No rituals yet' : 'Nothing here yet'}</h3><p>Add a habit to start making memories on your calendar.</p></div>}
          </div>
          <div className="calendar-note"><Activity size={15} /><span>Review check-ins for the selected date.</span></div>
        </aside>
      </section>
    </>
  );
}

export default App;
