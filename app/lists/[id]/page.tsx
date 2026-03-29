'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { List as ListType, Task } from '@/types';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { TaskItem } from '@/components/task-item';
import {
  Plus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Archive,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ListDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const listId = params?.id as string;

  const [list, setList] = useState<ListType | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && listId) {
      fetchListAndTasks();
    }
  }, [status, router, listId]);

  const fetchListAndTasks = async () => {
    try {
      const [listRes, tasksRes, completedRes] = await Promise.all([
        fetch(`/api/lists/${listId}`),
        fetch(`/api/tasks?listId=${listId}&isCompleted=false`),
        fetch(`/api/tasks?listId=${listId}&isCompleted=true&isArchived=false`),
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setList(listData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      if (completedRes.ok) {
        const completedData = await completedRes.json();
        setCompletedTasks(completedData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          title: newTaskTitle,
          priority: newTaskPriority,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setNewTaskTitle('');
        setNewTaskPriority('medium');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [newTaskTitle, newTaskPriority, listId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask();
    }
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTaskTitle('');
    }
  };

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    if (completed) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCompletedTasks((prev) => [{ ...task, isCompleted: true }, ...prev]);
      }
    } else {
      const task = completedTasks.find((t) => t.id === taskId);
      if (task) {
        setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
        setTasks((prev) => [{ ...task, isCompleted: false }, ...prev]);
      }
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8">
          <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">List not found</p>
          <Link 
            href="/lists" 
            className="inline-flex items-center justify-center rounded-xl btn-primary text-white h-10 px-5 mt-4 text-sm font-medium"
          >
            Go back to lists
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/lists" 
              className="inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.03] h-10 w-10 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                {list.name}
              </h1>
              {list.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{list.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'open'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
            }`}
          >
            <Circle className="h-4 w-4" />
            Open ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedTasks.length})
          </button>
        </div>

        {/* Create task form */}
        {isCreating && activeTab === 'open' && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in">
            <div className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-12 bg-white/[0.03] border-white/[0.08] rounded-xl text-base"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewTaskPriority(priority)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 border ${
                        newTaskPriority === priority
                          ? getPriorityClass(priority)
                          : 'bg-white/[0.03] text-muted-foreground border-white/[0.06] hover:border-white/[0.1]'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTaskTitle('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-5 py-2 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          {activeTab === 'open' ? (
            tasks.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No open tasks</h3>
                <p className="text-sm text-muted-foreground mb-5">All tasks in this list are completed</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add a task
                </button>
              </div>
            ) : (
              tasks
                .sort((a, b) => {
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                    showList={false}
                  />
                ))
            )
          ) : completedTasks.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <Archive className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No completed tasks</h3>
              <p className="text-sm text-muted-foreground">Completed tasks will appear here</p>
            </div>
          ) : (
            completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={handleTaskComplete}
                onDelete={handleTaskDelete}
                showList={false}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
