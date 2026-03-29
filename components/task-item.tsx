'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { formatDate } from '@/lib/utils';
import { Check, ChevronDown, ListTodo, Calendar, Flag } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string, completed: boolean) => void;
  showList?: boolean;
  level?: number;
}

export function TaskItem({ task, onComplete, showList = false, level = 0 }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isLoading, setIsLoading] = useState(false);

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

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <div 
      className={`${level > 0 ? 'ml-6 border-l border-white/[0.06] pl-4' : ''}`}
    >
      <div
        onClick={toggleExpand}
        className={`group glass-card rounded-xl p-4 transition-all duration-200 cursor-pointer hover:bg-white/[0.04] ${
          isCompleted ? 'opacity-50' : ''
        } ${isExpanded ? 'bg-white/[0.04]' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={isLoading}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
              isCompleted
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'border-white/[0.15] hover:border-white/[0.25]'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            {isCompleted && <Check className="h-3 w-3" />}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h4 className={`font-medium text-sm leading-relaxed ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              {task.priority && task.priority !== 'medium' && (
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getPriorityClass()}`}>
                  <Flag className="h-2.5 w-2.5" />
                  {task.priority}
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
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
              {hasSubtasks && (
                <span className="inline-flex items-center gap-1">
                  {task.subtasks?.length || 0} subtask{task.subtasks?.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Description preview */}
            {task.description && (
              <div className={`mt-2 text-xs text-muted-foreground ${!isExpanded ? 'line-clamp-1' : ''}`}>
                {task.description}
              </div>
            )}
          </div>

          {/* Expand button */}
          {hasSubtasks && (
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

        {/* Expanded subtasks */}
        {isExpanded && hasSubtasks && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
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
    </div>
  );
}
