import React, { useState } from 'react';
import { Plus, Check, Trash2, Flame, Target } from 'lucide-react';
import { TaskItem } from '../types';

interface Props {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onSelectActiveTask: (task: TaskItem) => void;
  onAddTask: (title: string, category: TaskItem['category'], est: number) => void;
  onToggleTaskComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskQueue: React.FC<Props> = ({
  tasks,
  activeTaskId,
  onSelectActiveTask,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('Engineering');
  const [newEst, setNewEst] = useState<number>(2);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newCategory, newEst);
    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
      {/* Header and Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Daily Focus Queue</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Prioritize high-impact deep work blocks</p>
        </div>

        {/* Filter segmented buttons (compliant with Zero-Pill interactive controls) */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950/80 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Active ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Done ({tasks.filter((t) => t.completed).length})
          </button>
        </div>
      </div>

      {/* New Task Input Form */}
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="What do you want to accomplish?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-hidden focus:border-amber-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as TaskItem['category'])}
            className="px-2.5 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-hidden focus:border-amber-500"
          >
            <option value="Engineering">Engineering</option>
            <option value="Deep Writing">Deep Writing</option>
            <option value="Research">Research</option>
            <option value="Architecture">Architecture</option>
            <option value="Review">Review</option>
          </select>

          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
            <span className="text-[11px] text-neutral-500">Est:</span>
            <input
              type="number"
              min="1"
              max="12"
              value={newEst}
              onChange={(e) => setNewEst(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-8 text-xs font-mono text-center bg-transparent text-neutral-200 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl">
            <Target className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No tasks in this view</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">Add an item above to anchor your session</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isActive = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : task.completed
                    ? 'bg-neutral-950/40 border-neutral-850 opacity-60'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'border-neutral-700 hover:border-neutral-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <span
                      className={`text-xs font-medium block truncate ${
                        task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Unboxed clean metadata (Zero-Pill compliant) */}
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Select as Active Task */}
                  {!task.completed && (
                    <button
                      onClick={() => onSelectActiveTask(task)}
                      className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-neutral-950 font-semibold'
                          : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-850'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>{isActive ? 'Current' : 'Focus'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
