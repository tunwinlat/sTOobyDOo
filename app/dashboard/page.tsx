'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { Layout } from '@/components/layout';
import { TaskItem } from '@/components/task-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?isCompleted=false');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: completed } : t))
    );
    if (completed) {
      // Remove from list after a short delay
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }, 500);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const highPriorityCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriorityCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowPriorityCount = tasks.filter((t) => t.priority === 'low').length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <Button onClick={() => router.push('/lists')}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{highPriorityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{mediumPriorityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Open Tasks</h2>
          
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">No open tasks across all your lists.</p>
                <Button className="mt-4" variant="outline" onClick={() => router.push('/lists')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create a task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks
                .sort((a, b) => {
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    showList={true}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
