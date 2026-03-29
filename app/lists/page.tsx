'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { List, Task } from '@/types';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import {
  Plus,
  ArrowRight,
  Loader2,
  Folder,
  ListTodo,
} from 'lucide-react';

export default function ListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchLists();
    }
  }, [status, router]);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setCreatingId('new');
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
        }),
      });

      if (res.ok) {
        const newList = await res.json();
        setLists((prev) => [newList, ...prev]);
        setNewListName('');
        setNewListDescription('');
        setIsCreating(false);
        router.push(`/lists/${newList.id}`);
      }
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setCreatingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateList();
    }
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewListName('');
      setNewListDescription('');
    }
  };

  const getTaskCount = (list: List) => {
    // Use _count from API if available, otherwise fall back to tasks array
    const total = (list as any)._count?.tasks ?? list.tasks?.length ?? 0;
    return { total, completed: 0 }; // API only returns open task count
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              Lists
            </h1>
            <p className="text-muted-foreground text-sm">Organize your tasks into collections</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New List
          </button>
        </div>

        {/* Create list form */}
        {isCreating && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in">
            <div className="space-y-3">
              <Input
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-base"
              />
              <Input
                placeholder="Description (optional)"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 bg-white/[0.03] border-white/[0.08] rounded-xl"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewListName('');
                    setNewListDescription('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || creatingId === 'new'}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
                >
                  {creatingId === 'new' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lists Grid */}
        {lists.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Folder className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No lists yet</h3>
            <p className="text-sm text-muted-foreground mb-5">Create your first list to start organizing tasks</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create List
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => {
              const { total } = getTaskCount(list);
              
              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="group glass-card glass-card-hover rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-base mb-1 group-hover:text-foreground transition-colors">
                    {list.name}
                  </h3>
                  
                  {list.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                      {list.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{total} open task{total !== 1 ? 's' : ''}</span>
                  </div>

                  {total > 0 && (
                    <div className="mt-4">
                      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-foreground/50 transition-all duration-500"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
