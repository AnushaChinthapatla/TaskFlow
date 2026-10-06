import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Category, Task, TaskFilters, TaskInput, TaskState, TaskStats } from '../types';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import CategoryManager from '../components/CategoryManager';

const columns: { status: TaskState; label: string; accent: string }[] = [
  { status: 'Todo', label: 'To do', accent: 'bg-slate-400' },
  { status: 'InProgress', label: 'In progress', accent: 'bg-indigo-500' },
  { status: 'Done', label: 'Done', accent: 'bg-emerald-500' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({ search: '', categoryId: '', priority: '', sort: 'created' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ task: Task | null; status?: TaskState } | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadTasks = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([api.getTasks(filters), api.getStats()]);
      setTasks(t);
      setStats(s);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCategories = useCallback(async () => {
    try { setCategories(await api.getCategories()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load categories.'); }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const save = async (input: TaskInput) => {
    if (editing?.task) await api.updateTask(editing.task.id, input);
    else await api.createTask(input);
    setEditing(null);
    await Promise.all([loadTasks(), loadCategories()]);
  };

  const move = async (task: Task, status: TaskState) => {
    // Optimistic update: the card jumps columns instantly, then we sync with the server
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try { await api.setStatus(task.id, status); await loadTasks(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not move task.'); await loadTasks(); }
  };

  const remove = async (task: Task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try { await api.deleteTask(task.id); await Promise.all([loadTasks(), loadCategories()]); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete task.'); }
  };

  const statCards = [
    { label: 'Total', value: stats?.total, color: 'text-slate-800' },
    { label: 'To do', value: stats?.todo, color: 'text-slate-600' },
    { label: 'In progress', value: stats?.inProgress, color: 'text-indigo-600' },
    { label: 'Done', value: stats?.done, color: 'text-emerald-600' },
    { label: 'Overdue', value: stats?.overdue, color: 'text-red-600' },
  ];
  const completion = stats && stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">✓</div>
            <span className="text-lg font-bold">TaskFlow</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">Hi, {user?.name}</span>
            <button className="btn-ghost" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '–'}</p>
            </div>
          ))}
        </section>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Overall progress</span><span>{completion}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <section className="flex flex-wrap items-center gap-2">
          <input className="input max-w-xs" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-auto" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input w-auto" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">Any priority</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select className="input w-auto" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="created">Newest first</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button className="btn-ghost border border-slate-200" onClick={() => setShowCategories(true)}>Categories</button>
            <button className="btn-primary" onClick={() => setEditing({ task: null })}>+ New task</button>
          </div>
        </section>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="py-16 text-center text-slate-400">Loading your tasks…</p>
        ) : (
          <section className="grid gap-4 md:grid-cols-3">
            {columns.map((col) => {
              const items = tasks.filter((t) => t.status === col.status);
              return (
                <div key={col.status} className="rounded-2xl bg-slate-100/70 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                      {col.label}
                      <span className="rounded-full bg-white px-2 text-xs text-slate-500">{items.length}</span>
                    </div>
                    <button aria-label={`Add task to ${col.label}`} className="rounded px-2 text-slate-500 hover:bg-white"
                      onClick={() => setEditing({ task: null, status: col.status })}>+</button>
                  </div>
                  <div className="space-y-3">
                    {items.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nothing here yet</p>}
                    {items.map((t) => (
                      <TaskCard key={t.id} task={t}
                        category={t.categoryId ? categoryById.get(t.categoryId) : undefined}
                        onMove={(s) => move(t, s)} onEdit={() => setEditing({ task: t })} onDelete={() => remove(t)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {editing && (
        <TaskForm task={editing.task} defaultStatus={editing.status} categories={categories}
          onSave={save} onClose={() => setEditing(null)} />
      )}
      {showCategories && (
        <CategoryManager categories={categories}
          onChanged={() => { loadCategories(); loadTasks(); }} onClose={() => setShowCategories(false)} />
      )}
    </div>
  );
}
