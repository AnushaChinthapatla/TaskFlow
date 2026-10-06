import { useState, type FormEvent } from 'react';
import type { Category, Task, TaskInput, TaskPriority, TaskState } from '../types';
import Modal from './Modal';

interface Props {
  task: Task | null;
  categories: Category[];
  defaultStatus?: TaskState;
  onSave: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

export default function TaskForm({ task, categories, defaultStatus = 'Todo', onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskState>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'Medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId?.toString() ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate || null,
        categoryId: categoryId ? Number(categoryId) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the task.');
      setBusy(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required autoFocus />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TaskState)}>
              <option value="Todo">To do</option>
              <option value="InProgress">In progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Due date</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || !title.trim()}>{busy ? 'Saving…' : 'Save task'}</button>
        </div>
      </form>
    </Modal>
  );
}
