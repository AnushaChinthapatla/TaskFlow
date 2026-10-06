import { useState, type FormEvent } from 'react';
import type { Category } from '../types';
import Modal from './Modal';
import { api } from '../api';

const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function CategoryManager({ categories, onChanged, onClose }: {
  categories: Category[]; onChanged: () => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(palette[0]);
  const [error, setError] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createCategory(name.trim(), color);
      setName('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category.');
    }
  };

  const remove = async (c: Category) => {
    const msg = c.taskCount
      ? `Delete "${c.name}"? Its ${c.taskCount} task(s) will be kept but uncategorised.`
      : `Delete "${c.name}"?`;
    if (!confirm(msg)) return;
    try {
      await api.deleteCategory(c.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category.');
    }
  };

  return (
    <Modal title="Manage categories" onClose={onClose}>
      <ul className="mb-4 space-y-2">
        {categories.length === 0 && <li className="text-sm text-slate-500">No categories yet.</li>}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name} <span className="text-xs text-slate-400">({c.taskCount})</span>
            </span>
            <button onClick={() => remove(c)} className="text-xs text-red-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="space-y-3 border-t border-slate-100 pt-4">
        <input className="input" placeholder="New category name" value={name} maxLength={50}
          onChange={(e) => setName(e.target.value)} required />
        <div className="flex items-center gap-2">
          {palette.map((p) => (
            <button type="button" key={p} aria-label={`Color ${p}`} onClick={() => setColor(p)}
              className={`h-6 w-6 rounded-full ring-offset-2 ${color === p ? 'ring-2 ring-slate-700' : ''}`}
              style={{ backgroundColor: p }} />
          ))}
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary" disabled={!name.trim()}>Add category</button>
      </form>
    </Modal>
  );
}
