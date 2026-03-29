'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { formatDate } from '@/lib/utils';
import { Check, ChevronDown, ListTodo, Calendar, Flag, Trash2, MoreHorizontal } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string, completed: boolean) => void;
  onDelete?: (taskId: string) => void;
  showList?: boolean;
  level?: number;
}

export function TaskItem({ task, onComplete, onDelete, showList = false, level = 0 }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
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
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
    <div 
      className={`${level > 0 ? 'ml-6 border-l border-white/[0.06] pl-4' : ''}`}
    >
      <div
        onClick={isClickable ? toggleExpand : undefined}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`group glass-card rounded-xl p-4 transition-all duration-200 ${
          isClickable ? 'cursor-pointer hover:bg-white/[0.04]' : ''
        } ${isCompleted ? 'opacity-50' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Priority indicator dot */}
          <div className={`mt-2 flex-shrink-0 w-2 h-2 rounded-full ${getPriorityDot()}`} />

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium text-sm leading-relaxed ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              
              {/* Action buttons - visible on hover or always for completed tasks */}
              <div className={`flex items-center gap-1 transition-opacity duration-200 ${showActions || isCompleted ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={handleToggleComplete}
                  disabled={isLoading}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isCompleted 
                      ? 'text-emerald-400 hover:bg-emerald-500/10' 
                      : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
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
              {isClickable && (
                <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                  <MoreHorizontal className="h-3 w-3" />
                  Click to expand
                </span>
              )}
            </div>

            {/* Description preview */}
            {hasDescription && (
              <div className={`mt-2 text-xs text-muted-foreground ${!isExpanded ? 'line-clamp-1' : ''}`}>
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
              className={`flex-shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 ${
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
                <p className="text-xs font-medium text-muted-foreground mb-2">Subtasks</p>
                {task.subtasks?.map((subtask) => (
                  <div key={subtask.id} className="flex items-start gap-2">
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border ${
                      subtask.isCompleted ? 'bg-emerald-500/20 border-emerald-500/50' : 'border-white/[0.1]'
                    }`}>
                      {subtask.isCompleted && <Check className="h-2.5 w-2.5 m-auto text-emerald-400" />}
                    </div>
                    <span className={`text-sm ${subtask.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
