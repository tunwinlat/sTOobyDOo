'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className={cn('space-y-2', level > 0 && 'ml-8 border-l-2 border-muted pl-4')}>
      <div
        className={cn(
          'group flex items-start gap-3 p-4 rounded-lg border bg-card transition-all',
          isCompleted && 'opacity-60 bg-muted/50',
          !isCompleted && 'hover:border-primary/20 hover:shadow-sm'
        )}
      >
        {/* Expand button for subtasks */}
        {hasSubtasks ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Complete toggle */}
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className={cn(
            'mt-0.5 flex-shrink-0 transition-colors',
            isCompleted ? 'text-green-500' : 'text-muted-foreground hover:text-primary'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <Link
              href={`/lists/${task.listId}?task=${task.id}`}
              className={cn(
                'font-medium hover:underline transition-colors',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </Link>
            <Badge variant="outline" className={cn('text-xs', getPriorityClass(task.priority))}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </Badge>
          </div>

          {task.description && (
            <p className={cn('text-sm mt-1', isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {showList && task.list && (
              <div className="flex items-center gap-1">
                <List className="h-3 w-3" />
                <span style={{ color: task.list.color }}>{task.list.name}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={cn(
                'flex items-center gap-1',
                new Date(task.dueDate) < new Date() && !isCompleted && 'text-red-500'
              )}>
                <Clock className="h-3 w-3" />
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <span className="text-primary">@{task.assignedTo.name}</span>
              </div>
            )}

            {hasSubtasks && (
              <div className="flex items-center gap-1">
                <span>
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
