'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { Layout } from '@/components/layout';
import { TaskItem } from '@/components/task-item';
import { Plus, CheckCircle2, Circle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

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
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }, 500);
    }
  };

  const highPriorityCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriorityCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowPriorityCount = tasks.filter((t) => t.priority === 'low').length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            New Task
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-3xl p-6 glow-purple">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tasks</p>
                <p className="text-4xl font-bold mt-2">{tasks.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Circle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 glow-pink">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-4xl font-bold mt-2 priority-high">{highPriorityCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 glow-blue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                <p className="text-4xl font-bold mt-2 priority-medium">{mediumPriorityCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 glow-green">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-4xl font-bold mt-2 text-emerald-500">-</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Open Tasks</h2>
          
          {tasks.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground mb-6">No open tasks across all your lists.</p>
              <Link
                href="/lists"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                Create a task
              </Link>
            </div>
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
