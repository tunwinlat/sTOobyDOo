'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { List, Task } from '@/types';
import { Layout } from '@/components/layout';
import { TaskItem } from '@/components/task-item';
import {
  Plus,
  ListTodo,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Folder,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [recentLists, setRecentLists] = useState<List[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    listsCount: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const [listsRes, tasksRes] = await Promise.all([
        fetch('/api/lists'),
        fetch('/api/tasks'),
      ]);

      if (listsRes.ok) {
        const lists = await listsRes.json();
        setRecentLists(lists.slice(0, 4));
        setStats(prev => ({ ...prev, listsCount: lists.length }));
      }

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        const incompleteTasks = tasks.filter((t: Task) => !t.isCompleted);
        
        const highPriority = incompleteTasks
          .filter((t: Task) => t.priority === 'high')
          .slice(0, 5);
        setPriorityTasks(highPriority);

        const today = new Date().toISOString().split('T')[0];
        const todayList = incompleteTasks
          .filter((t: Task) => !t.dueDate || t.dueDate.startsWith(today))
          .slice(0, 5);
        setTodayTasks(todayList);

        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: Task) => t.isCompleted).length,
          listsCount: recentLists.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    if (completed) {
      setPriorityTasks(prev => prev.filter(t => t.id !== taskId));
      setTodayTasks(prev => prev.filter(t => t.id !== taskId));
      setStats(prev => ({
        ...prev,
        completedTasks: prev.completedTasks + 1,
      }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8">
          <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-1">
                Welcome back, {session?.user?.name?.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground">
                You have {priorityTasks.length} high priority tasks and {todayTasks.length} tasks for today
              </p>
            </div>
            <Link
              href="/lists"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
            <div>
              <div className="text-2xl font-semibold text-foreground">
                {stats.totalTasks - stats.completedTasks}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">Open Tasks</div>
            </div>
            <div className="border-x border-white/[0.06] px-4">
              <div className="text-2xl font-semibold text-foreground">
                {stats.completedTasks}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">Completed</div>
            </div>
            <div className="pl-4">
              <div className="text-2xl font-semibold text-foreground">
                {stats.listsCount}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">Lists</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
                Today&apos;s Tasks
              </h2>
              <Link 
                href="/lists" 
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="h-12 w-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No tasks for today</p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    showList
                  />
                ))
              )}
            </div>
          </div>

          {/* High Priority */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
                High Priority
              </h2>
              <Link 
                href="/lists" 
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="space-y-2">
              {priorityTasks.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="h-12 w-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No high priority tasks</p>
                </div>
              ) : (
                priorityTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    showList
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Lists */}
        {recentLists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Folder className="h-4.5 w-4.5 text-muted-foreground" />
                Recent Lists
              </h2>
              <Link 
                href="/lists" 
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentLists.map((list) => {
                const tasks = list.tasks || [];
                const total = tasks.length;
                const completed = tasks.filter((t: Task) => t.isCompleted).length;
                const progress = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="group glass-card glass-card-hover rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-9 w-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-foreground transition-colors">
                      {list.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{total} tasks</span>
                      {total > 0 && completed > 0 && (
                        <span>{completed} done</span>
                      )}
                    </div>

                    {total > 0 && (
                      <div className="mt-3">
                        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-foreground/60 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
