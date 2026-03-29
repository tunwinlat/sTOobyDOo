'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { List as ListType, Task } from '@/types';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskItem } from '@/components/task-item';
import {
  Plus,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Archive,
  CheckCircle2,
  Circle,
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

  const handleCreateTask = async () => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-muted';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">List not found</p>
          <Link href="/lists" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4">
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
          <div className="flex items-center gap-4">
            <Link href="/lists" className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
              {list.description && (
                <p className="text-muted-foreground">{list.description}</p>
              )}
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'open'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Circle className="h-4 w-4 inline mr-2" />
            Open ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 inline mr-2" />
            Completed ({completedTasks.length})
          </button>
        </div>

        {/* Create task form */}
        {isCreating && activeTab === 'open' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                    autoFocus
                  />
                  <Button onClick={handleCreateTask}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewTaskPriority(priority)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                        newTaskPriority === priority
                          ? getPriorityColor(priority)
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks */}
        <div className="space-y-3">
          {activeTab === 'open' ? (
            tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No open tasks
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All tasks in this list are completed!
                  </p>
                  <Button className="mt-4" onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add a task
                  </Button>
                </CardContent>
              </Card>
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
                    showList={false}
                  />
                ))
            )
          ) : completedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No completed tasks
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed tasks will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={handleTaskComplete}
                showList={false}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
