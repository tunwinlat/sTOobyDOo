'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Bell, Mail, User, Shield, Cpu } from 'lucide-react';
import Link from 'next/link';

function SimpleSwitch({ 
  checked, 
  onCheckedChange 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
        checked ? 'bg-foreground/80' : 'bg-white/[0.08]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    emailNotifications: true,
    pushNotifications: false,
    pushoverUserKey: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          name: data.name || '',
          email: data.email || '',
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? false,
          pushoverUserKey: data.pushoverUserKey || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        // Show success feedback
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
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

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">Profile</h2>
              <p className="text-xs text-muted-foreground">Your personal information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={settings.email}
                disabled
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm opacity-50"
              />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">Notifications</h2>
              <p className="text-xs text-muted-foreground">How you want to be notified</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-sm font-medium">Email Notifications</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive email updates about your tasks
                </p>
              </div>
              <SimpleSwitch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-sm font-medium">Push Notifications</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications via Pushover
                </p>
              </div>
              <SimpleSwitch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, pushNotifications: checked }))
                }
              />
            </div>

            {settings.pushNotifications && (
              <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                <label className="text-xs font-medium text-muted-foreground">Pushover User Key</label>
                <Input
                  value={settings.pushoverUserKey}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, pushoverUserKey: e.target.value }))
                  }
                  placeholder="Your Pushover user key"
                  className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* MCP Tokens */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">MCP Integration</h2>
              <p className="text-xs text-muted-foreground">Manage LLM access to your tasks</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            Create MCP tokens to allow LLMs (like Claude, GPT, etc.) to access and manage your tasks.
            You can create multiple tokens with different permissions.
          </p>
          <Link
            href="/settings/mcp"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-ghost text-sm font-medium"
          >
            Manage MCP Tokens
          </Link>
        </div>

        {/* Admin Settings Link (only for admins) */}
        {session?.user?.isAdmin && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-medium">Administration</h2>
                <p className="text-xs text-muted-foreground">Family-wide settings</p>
              </div>
            </div>
            <Link
              href="/settings/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-ghost text-sm font-medium"
            >
              Admin Settings
            </Link>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
