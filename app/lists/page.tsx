'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { List as ListType } from '@/types';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  ListTodo,
  Loader2,
  MoreVertical,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
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
            <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
            <p className="text-muted-foreground">
              Manage your todo lists
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>

        {/* Create new list form */}
        {isCreating && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  autoFocus
                />
                <Button onClick={handleCreateList}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lists grid */}
        {lists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No lists yet</p>
              <p className="text-sm text-muted-foreground">Create your first list to get started.</p>
              <Button className="mt-4" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create a list
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Card key={list.id} className="group hover:border-primary/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${list.color}20` }}
                      >
                        <ListTodo className="h-5 w-5" style={{ color: list.color }} />
                      </div>
                      <div>
                        {editingList === list.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 w-40"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditList(list.id);
                                if (e.key === 'Escape') setEditingList(null);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleEditList(list.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Link
                            href={`/lists/${list.id}`}
                            className="font-semibold hover:underline"
                          >
                            {list.name}
                          </Link>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {list._count?.tasks || 0} open tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingList(list.id);
                          setEditName(list.name);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {list.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {list.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
