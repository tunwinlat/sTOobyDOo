'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { McpToken } from '@/types';
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

export default function McpSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchTokens();
    }
  }, [status, router]);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/mcp-tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;

    try {
      const res = await fetch('/api/mcp-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName,
          allowAllLists: true,
          canCreateTasks: true,
          canCompleteTasks: true,
          canEditTasks: true,
        }),
      });

      if (res.ok) {
        const newToken = await res.json();
        setTokens((prev) => [newToken, ...prev]);
        setNewTokenName('');
        setIsCreating(false);
        // Auto-reveal the new token
        setRevealedTokens((prev) => new Set(prev).add(newToken.id));
      }
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this MCP token?')) {
      return;
    }

    try {
      const res = await fetch(`/api/mcp-tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  };

  const copyToClipboard = async (text: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(tokenId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleReveal = (tokenId: string) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(tokenId)) {
        next.delete(tokenId);
      } else {
        next.add(tokenId);
      }
      return next;
    });
  };

  const getMcpUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/mcp?token=${token}`;
    }
    return `/api/mcp?token=${token}`;
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
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Tokens</h1>
          <p className="text-muted-foreground">
            Manage API tokens for LLM integrations
          </p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              About MCP Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Model Context Protocol (MCP) allows LLMs like Claude, GPT, and others to interact
              with your todo lists. Each token can have different permissions and list access.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">MCP Endpoint URL:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/mcp
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Create Token */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Token</CardTitle>
            <CardDescription>Generate a new MCP access token</CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Token name (e.g., 'Claude Desktop')"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateToken()}
                  autoFocus
                />
                <Button onClick={handleCreateToken}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Token
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tokens List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Tokens</h2>
          
          {tokens.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Cpu className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No tokens yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first MCP token to enable LLM access
                </p>
              </CardContent>
            </Card>
          ) : (
            tokens.map((token) => (
              <Card key={token.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{token.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(token.createdAt).toLocaleDateString()}
                        {token.lastUsedAt && (
                          <span> • Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteToken(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Token Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                        {revealedTokens.has(token.id) ? token.token : '•'.repeat(40)}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => toggleReveal(token.id)}
                      >
                        {revealedTokens.has(token.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(token.token, token.id)}
                      >
                        {copiedId === token.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* MCP URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">MCP URL</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                        {getMcpUrl(token.token)}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(getMcpUrl(token.token), `${token.id}-url`)}
                      >
                        {copiedId === `${token.id}-url` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={token.canCreateTasks ? 'default' : 'outline'}>
                        Create Tasks
                      </Badge>
                      <Badge variant={token.canCompleteTasks ? 'default' : 'outline'}>
                        Complete Tasks
                      </Badge>
                      <Badge variant={token.canEditTasks ? 'default' : 'outline'}>
                        Edit Tasks
                      </Badge>
                      <Badge variant={token.canDeleteTasks ? 'default' : 'outline'}>
                        Delete Tasks
                      </Badge>
                      <Badge variant={token.canCreateLists ? 'default' : 'outline'}>
                        Create Lists
                      </Badge>
                    </div>
                  </div>

                  {/* List Access */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">List Access</p>
                    {token.allowAllLists ? (
                      <Badge variant="secondary">All Lists</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {token.listAccess?.map((la) => (
                          <Badge key={la.list.id} variant="outline">
                            {la.list.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
