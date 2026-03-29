'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { List as ListType } from '@/types';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Plus, ListTodo, Loader2, Trash2, Edit3, Check, X, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default function ListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<ListType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName }),
      });

      if (res.ok) {
        const newList = await res.json();
        setLists((prev) => [newList, ...prev]);
        setNewListName('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All tasks will be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleEditList = async (listId: string) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });

      if (res.ok) {
        const updatedList = await res.json();
        setLists((prev) =>
          prev.map((l) => (l.id === listId ? { ...l, name: updatedList.name } : l))
        );
        setEditingList(null);
      }
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const getListColor = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3b82f6': 'from-blue-500 to-cyan-500',
      '#ef4444': 'from-red-500 to-pink-500',
      '#22c55e': 'from-emerald-500 to-teal-500',
      '#f59e0b': 'from-amber-500 to-orange-500',
      '#8b5cf6': 'from-purple-500 to-violet-500',
    };
    return colorMap[color] || 'from-purple-500 to-pink-500';
  };

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
              Lists
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your todo lists
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            New List
          </button>
        </div>

        {/* Create new list form */}
        {isCreating && (
          <div className="glass-card rounded-3xl p-6">
            <div className="flex gap-3">
              <Input
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                className="flex-1 bg-white/5 border-white/10 rounded-xl"
                autoFocus
              />
              <button
                onClick={handleCreateList}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Lists grid */}
        {lists.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No lists yet</h3>
            <p className="text-muted-foreground mb-6">Create your first list to get started.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Create a list
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="glass-card rounded-3xl p-6 group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getListColor(list.color)} flex items-center justify-center text-white shadow-lg`}
                    >
                      <ListTodo className="h-7 w-7" />
                    </div>
                    <div>
                      {editingList === list.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-10 w-40 bg-white/5 border-white/10 rounded-xl"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditList(list.id);
                              if (e.key === 'Escape') setEditingList(null);
                            }}
                          />
                        </div>
                      ) : (
                        <Link
                          href={`/lists/${list.id}`}
                          className="font-bold text-xl hover:text-purple-400 transition-colors"
                        >
                          {list.name}
                        </Link>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {list._count?.tasks || 0} open tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingList(list.id);
                        setEditName(list.name);
                      }}
                      className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="p-2 rounded-xl bg-white/5 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {editingList === list.id && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEditList(list.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingList(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-muted-foreground text-sm font-medium hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {list.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-4">
                    {list.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
