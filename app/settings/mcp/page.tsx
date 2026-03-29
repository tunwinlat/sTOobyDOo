'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
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
  ArrowLeft,
  Edit3,
  X,
} from 'lucide-react';
import Link from 'next/link';

// Permission Toggle Component
function PermissionToggle({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
        checked 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
          : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground'
      }`}
    >
      <div className={`w-3.5 h-3.5 rounded-full ${checked ? 'bg-emerald-500' : 'bg-white/10'}`} />
      {label}
    </button>
  );
}

export default function McpSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPermissions, setNewTokenPermissions] = useState({
    allowAllLists: true,
    canCreateTasks: true,
    canCompleteTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canCreateLists: false,
    canEditLists: false,
    canDeleteLists: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());
  const [editingToken, setEditingToken] = useState<McpToken | null>(null);
  const [editPermissions, setEditPermissions] = useState({
    allowAllLists: true,
    canCreateTasks: true,
    canCompleteTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canCreateLists: false,
    canEditLists: false,
    canDeleteLists: false,
  });

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
          ...newTokenPermissions,
        }),
      });

      if (res.ok) {
        const newToken = await res.json();
        setTokens((prev) => [newToken, ...prev]);
        setNewTokenName('');
        setNewTokenPermissions({
          allowAllLists: true,
          canCreateTasks: true,
          canCompleteTasks: true,
          canEditTasks: true,
          canDeleteTasks: false,
          canCreateLists: false,
          canEditLists: false,
          canDeleteLists: false,
        });
        setIsCreating(false);
        setRevealedTokens((prev) => new Set(prev).add(newToken.id));
      }
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const togglePermission = (key: keyof typeof newTokenPermissions) => {
    setNewTokenPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startEditingToken = (token: McpToken) => {
    setEditingToken(token);
    setEditPermissions({
      allowAllLists: token.allowAllLists,
      canCreateTasks: token.canCreateTasks,
      canCompleteTasks: token.canCompleteTasks,
      canEditTasks: token.canEditTasks,
      canDeleteTasks: token.canDeleteTasks,
      canCreateLists: token.canCreateLists,
      canEditLists: token.canEditLists,
      canDeleteLists: token.canDeleteLists,
    });
  };

  const handleUpdateToken = async () => {
    if (!editingToken) return;

    try {
      const res = await fetch(`/api/mcp-tokens/${editingToken.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPermissions),
      });

      if (res.ok) {
        const updatedToken = await res.json();
        setTokens((prev) => prev.map((t) => t.id === updatedToken.id ? updatedToken : t));
        setEditingToken(null);
      }
    } catch (error) {
      console.error('Failed to update token:', error);
    }
  };

  const toggleEditPermission = (key: keyof typeof editPermissions) => {
    setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
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
        <div className="glass-card rounded-2xl p-8">
          <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link 
            href="/settings" 
            className="inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.03] h-10 w-10 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-0.5">
              MCP Tokens
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage API tokens for LLM integrations
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">About MCP Integration</h2>
              <p className="text-xs text-muted-foreground">Model Context Protocol</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            MCP allows LLMs like Claude, GPT, and others to interact with your todo lists. 
            Each token can have different permissions and list access.
          </p>
          <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">MCP Endpoint URL:</p>
            <code className="text-xs font-mono text-foreground block">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/mcp
            </code>
          </div>
        </div>

        {/* Create Token */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-medium mb-4">Create New Token</h2>
          {isCreating ? (
            <div className="space-y-4">
              <Input
                placeholder="Token name (e.g., 'Claude Desktop')"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateToken()}
                autoFocus
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
              
              {/* Permissions */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs font-medium text-muted-foreground">Permissions</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <PermissionToggle
                    label="Create Tasks"
                    checked={newTokenPermissions.canCreateTasks}
                    onChange={() => togglePermission('canCreateTasks')}
                  />
                  <PermissionToggle
                    label="Complete Tasks"
                    checked={newTokenPermissions.canCompleteTasks}
                    onChange={() => togglePermission('canCompleteTasks')}
                  />
                  <PermissionToggle
                    label="Edit Tasks"
                    checked={newTokenPermissions.canEditTasks}
                    onChange={() => togglePermission('canEditTasks')}
                  />
                  <PermissionToggle
                    label="Delete Tasks"
                    checked={newTokenPermissions.canDeleteTasks}
                    onChange={() => togglePermission('canDeleteTasks')}
                  />
                  <PermissionToggle
                    label="Create Lists"
                    checked={newTokenPermissions.canCreateLists}
                    onChange={() => togglePermission('canCreateLists')}
                  />
                  <PermissionToggle
                    label="Edit Lists"
                    checked={newTokenPermissions.canEditLists}
                    onChange={() => togglePermission('canEditLists')}
                  />
                  <PermissionToggle
                    label="Delete Lists"
                    checked={newTokenPermissions.canDeleteLists}
                    onChange={() => togglePermission('canDeleteLists')}
                  />
                  <PermissionToggle
                    label="All Lists Access"
                    checked={newTokenPermissions.allowAllLists}
                    onChange={() => togglePermission('allowAllLists')}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    setNewTokenName('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateToken}
                  disabled={!newTokenName.trim()}
                  className="flex-1 px-4 py-2 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
                >
                  Create Token
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Token
            </button>
          )}
        </div>

        {/* Tokens List */}
        <div className="space-y-3">
          <h2 className="font-medium">Your Tokens</h2>
          
          {tokens.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No tokens yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first MCP token to enable LLM access
              </p>
            </div>
          ) : (
            tokens.map((token) => (
              <div key={token.id} className="glass-card rounded-2xl p-5">
                {editingToken?.id === token.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Edit Permissions</h3>
                      <button
                        onClick={() => setEditingToken(null)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionToggle
                        label="Create Tasks"
                        checked={editPermissions.canCreateTasks}
                        onChange={() => toggleEditPermission('canCreateTasks')}
                      />
                      <PermissionToggle
                        label="Complete Tasks"
                        checked={editPermissions.canCompleteTasks}
                        onChange={() => toggleEditPermission('canCompleteTasks')}
                      />
                      <PermissionToggle
                        label="Edit Tasks"
                        checked={editPermissions.canEditTasks}
                        onChange={() => toggleEditPermission('canEditTasks')}
                      />
                      <PermissionToggle
                        label="Delete Tasks"
                        checked={editPermissions.canDeleteTasks}
                        onChange={() => toggleEditPermission('canDeleteTasks')}
                      />
                      <PermissionToggle
                        label="Create Lists"
                        checked={editPermissions.canCreateLists}
                        onChange={() => toggleEditPermission('canCreateLists')}
                      />
                      <PermissionToggle
                        label="Edit Lists"
                        checked={editPermissions.canEditLists}
                        onChange={() => toggleEditPermission('canEditLists')}
                      />
                      <PermissionToggle
                        label="Delete Lists"
                        checked={editPermissions.canDeleteLists}
                        onChange={() => toggleEditPermission('canDeleteLists')}
                      />
                      <PermissionToggle
                        label="All Lists Access"
                        checked={editPermissions.allowAllLists}
                        onChange={() => toggleEditPermission('allowAllLists')}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setEditingToken(null)}
                        className="flex-1 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpdateToken}
                        className="flex-1 px-4 py-2 rounded-xl btn-primary text-white text-sm font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{token.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(token.createdAt).toLocaleDateString()}
                          {token.lastUsedAt && (
                            <span> • Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditingToken(token)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
                          title="Edit permissions"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete token"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                {/* Token Display */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-muted-foreground">Token</label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-xl text-xs font-mono break-all text-foreground">
                      {revealedTokens.has(token.id) ? token.token : '•'.repeat(40)}
                    </code>
                    <button
                      onClick={() => toggleReveal(token.id)}
                      className="p-2 rounded-xl btn-ghost"
                    >
                      {revealedTokens.has(token.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(token.token, token.id)}
                      className="p-2 rounded-xl btn-ghost"
                    >
                      {copiedId === token.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* MCP URL */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-muted-foreground">MCP URL</label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-xl text-xs font-mono break-all text-foreground">
                      {getMcpUrl(token.token)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getMcpUrl(token.token), `${token.id}-url`)}
                      className="p-2 rounded-xl btn-ghost"
                    >
                      {copiedId === `${token.id}-url` ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'canCreateTasks', label: 'Create' },
                      { key: 'canCompleteTasks', label: 'Complete' },
                      { key: 'canEditTasks', label: 'Edit' },
                      { key: 'canDeleteTasks', label: 'Delete' },
                      { key: 'canCreateLists', label: 'Create Lists' },
                    ].map((perm) => (
                      <span 
                        key={perm.key}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                          token[perm.key as keyof McpToken] 
                            ? 'bg-white/[0.06] text-foreground border-white/[0.1]' 
                            : 'bg-transparent text-muted-foreground border-white/[0.04]'
                        }`}
                      >
                        {perm.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* List Access */}
                <div className="pt-3 border-t border-white/[0.06] mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">List Access</p>
                  {token.allowAllLists ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/[0.06] text-foreground border border-white/[0.1]">
                      All Lists
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {token.listAccess?.map((la) => (
                        <span 
                          key={la.list.id} 
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/[0.03] text-muted-foreground border border-white/[0.06]"
                        >
                          {la.list.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
