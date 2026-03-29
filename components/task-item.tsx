'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  List,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string, completed: boolean) => void;
  showList?: boolean;
  level?: number;
}

export function TaskItem({ task, onComplete, showList = false, level = 0 }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      const newCompleted = !isCompleted;
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newCompleted }),
      });

      if (res.ok) {
        setIsCompleted(newCompleted);
        onComplete?.(task.id, newCompleted);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn('space-y-2', level > 0 && 'ml-8 border-l-2 border-purple-500/20 pl-4')}>
      <div
        className={cn(
          'group flex items-start gap-3 p-5 rounded-2xl glass-card transition-all duration-200',
          isCompleted && 'opacity-50',
          !isCompleted && 'hover:shadow-lg hover:shadow-purple-500/10'
        )}
      >
        {/* Expand button for subtasks */}
        {hasSubtasks ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        ) : (
          <div className="w-7" />
        )}

        {/* Complete toggle */}
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className={cn(
            'mt-0.5 flex-shrink-0 transition-all duration-200 p-1 rounded-full',
            isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-purple-400'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Circle className="h-6 w-6" />
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <Link
              href={`/lists/${task.listId}?task=${task.id}`}
              className={cn(
                'font-semibold text-lg hover:text-purple-400 transition-colors',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </Link>
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', getPriorityClass(task.priority))}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </span>
          </div>

          {task.description && (
            <p className={cn('text-sm mt-2', isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {showList && task.list && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                <List className="h-3 w-3" />
                <span style={{ color: task.list.color }}>{task.list.name}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                new Date(task.dueDate) < new Date() && !isCompleted ? 'bg-red-500/10 text-red-400' : 'bg-white/5'
              )}>
                <Clock className="h-3 w-3" />
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10">
                <span className="text-purple-400 font-medium">@{task.assignedTo.name}</span>
              </div>
            )}

            {hasSubtasks && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                <span className="text-muted-foreground">
                  {task.subtasks?.filter((st) => st.isCompleted).length || 0}/{task.subtasks?.length || 0} subtasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="space-y-2">
          {task.subtasks?.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onComplete={onComplete}
              showList={false}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
