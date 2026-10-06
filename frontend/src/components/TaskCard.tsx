import type { Category, Task, TaskPriority, TaskState } from '../types';

const priorityStyle: Record<TaskPriority, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-emerald-100 text-emerald-700',
};

const order: TaskState[] = ['Todo', 'InProgress', 'Done'];

interface Props {
  task: Task;
  category?: Category;
  onMove: (status: TaskState) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, category, onMove, onEdit, onDelete }: Props) {
  const idx = order.indexOf(task.status);
  const done = task.status === 'Done';

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : ''}`}>{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle[task.priority]}`}>{task.priority}</span>
      </div>

      {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
            {category.name}
          </span>
        )}
        {task.dueDate && (
          <span className={task.isOverdue ? 'font-medium text-red-600' : 'text-slate-500'}>
            {task.isOverdue ? '⚠ Overdue · ' : '📅 '}
            {new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex gap-1">
          <button disabled={idx === 0} onClick={() => onMove(order[idx - 1])} aria-label="Move left"
            className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">←</button>
          <button disabled={idx === 2} onClick={() => onMove(order[idx + 1])} aria-label="Move right"
            className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">→</button>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50">Edit</button>
          <button onClick={onDelete} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
}
