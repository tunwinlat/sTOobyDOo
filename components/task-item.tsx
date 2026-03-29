'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { formatDate } from '@/lib/utils';
import { Check, ChevronDown, ListTodo, Calendar, Flag, Trash2, MoreHorizontal, Edit3, Plus, X, ChevronRight } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string, completed: boolean) => void;
  onDelete?: (taskId: string) => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  showList?: boolean;
  level?: number;
}

// Simple inline confirmation component
function InlineConfirm({ 
  onConfirm, 
  onCancel, 
  message 
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
  message: string;
}) {
  return (
    <div className="absolute right-0 top-0 z-10 glass-card rounded-xl p-3 border border-red-500/20 shadow-lg min-w-[200px]">
      <p className="text-sm mb-3">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.06] text-foreground text-xs font-medium hover:bg-white/[0.1] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TaskItem({ task, onComplete, onDelete, onUpdate, showList = false, level = 0 }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleComplete = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const newCompletedState = !isCompleted;
    
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newCompletedState }),
      });

      if (res.ok) {
        setIsCompleted(newCompletedState);
        onComplete?.(task.id, newCompletedState);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete?.(task.id);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
    setShowConfirm(false);
  };

  const toggleExpand = () => {
    if (task.description || (task.subtasks && task.subtasks.length > 0)) {
      setIsExpanded(!isExpanded);
    }
  };

  const openEditModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const getPriorityClass = () => {
    switch (task.priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'bg-white/[0.03] text-muted-foreground border-white/[0.06]';
    }
  };

  const getPriorityDot = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-400';
      case 'medium':
        return 'bg-amber-400';
      case 'low':
        return 'bg-emerald-400';
      default:
        return 'bg-muted-foreground';
    }
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const hasDescription = task.description && task.description.length > 0;
  const isClickable = hasSubtasks || hasDescription;

  return (
    <>
      <div 
        className={`${level > 0 ? 'ml-6 border-l border-white/[0.06] pl-4' : ''}`}
      >
        <div
          onClick={toggleExpand}
          className={`group relative glass-card rounded-xl p-4 transition-all duration-200 ${
            isClickable ? 'cursor-pointer hover:bg-white/[0.04]' : ''
          } ${isCompleted ? 'opacity-50' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''}`}
        >
          {/* Confirmation popup */}
          {showConfirm && (
            <InlineConfirm
              message="Delete this task?"
              onConfirm={confirmDelete}
              onCancel={() => setShowConfirm(false)}
            />
          )}

          <div className="flex items-start gap-3">
            {/* Priority indicator dot - clickable to toggle complete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete();
              }}
              disabled={isLoading}
              className={`mt-2 flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all duration-200 ${getPriorityDot()} ${
                isLoading ? 'opacity-50' : 'hover:scale-125'
              } ${isCompleted ? 'opacity-50' : ''}`}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            />

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(e);
                  }}
                  className={`font-medium text-sm leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors ${
                    isCompleted ? 'line-through text-muted-foreground' : ''
                  }`}
                  title="Click to edit task"
                >
                  {task.title}
                </h4>
                
                {/* Action buttons */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={openEditModal}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-200"
                    title="Edit task"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                {showList && task.list && (
                  <Link 
                    href={`/lists/${task.list.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <ListTodo className="h-3 w-3" />
                    {task.list.name}
                  </Link>
                )}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.dueDate)}
                  </span>
                )}
                {task.priority && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getPriorityClass()}`}>
                    <Flag className="h-2.5 w-2.5" />
                    {task.priority}
                  </span>
                )}
                {hasSubtasks && (
                  <span className="inline-flex items-center gap-1">
                    {task.subtasks?.length || 0} subtask{task.subtasks?.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Description preview */}
              {hasDescription && !isExpanded && (
                <div className="mt-2 text-xs text-muted-foreground line-clamp-1">
                  {task.description}
                </div>
              )}
            </div>

            {/* Expand indicator */}
            {isClickable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.06] transition-all duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              {/* Full description */}
              {hasDescription && (
                <div className="mb-3 text-sm text-muted-foreground">
                  {task.description}
                </div>
              )}
              
              {/* Subtasks */}
              {hasSubtasks && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(e);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add subtask
                    </button>
                  </div>
                  {task.subtasks?.map((subtask) => (
                    <div key={subtask.id} className="flex items-start gap-2 group/subtask">
                      <div className={`mt-1 flex-shrink-0 w-3.5 h-3.5 rounded border ${
                        subtask.isCompleted ? 'bg-emerald-500/20 border-emerald-500/50' : 'border-white/[0.15]'
                      }`}>
                        {subtask.isCompleted && <Check className="h-2.5 w-2.5 m-auto text-emerald-400" />}
                      </div>
                      <span className={`text-sm flex-1 ${subtask.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </span>
                      {/* Nested subtasks indicator */}
                      {subtask.subtasks && subtask.subtasks.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {subtask.subtasks.length} more
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit button in expanded view */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(e);
                }}
                className="mt-3 w-full py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit task details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Edit Modal */}
      {showEditModal && (
        <TaskEditModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updates) => {
            onUpdate?.(task.id, updates);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

// Task Edit Modal Component
interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

function TaskEditModal({ task, onClose, onUpdate }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
        }),
      });

      if (res.ok) {
        onUpdate({ title, description: description || null, priority });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: task.listId,
          title: newSubtaskTitle,
          priority: 'medium',
          parentId: task.id,
        }),
      });

      if (res.ok) {
        const newSubtask = await res.json();
        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskTitle('');
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Edit Task</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:border-white/[0.15]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm resize-none focus:outline-none focus:border-white/[0.15]"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                    priority === p
                      ? p === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        p === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/[0.03] text-muted-foreground border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-medium text-muted-foreground">Subtasks</label>
            
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm flex-1">{subtask.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="flex-1 h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:border-white/[0.15]"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 h-9 rounded-xl bg-white/[0.06] text-foreground text-sm font-medium hover:bg-white/[0.1] transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-muted-foreground text-sm font-medium hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
