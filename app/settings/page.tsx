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
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        checked ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
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
      const res = await fetch('/api/user');
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
        <div className="glass-card rounded-3xl p-8">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your personal information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={settings.email}
                disabled
                className="bg-white/5 border-white/10 rounded-xl opacity-50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-sm text-muted-foreground">How you want to be notified</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <label className="font-medium">Email Notifications</label>
                </div>
                <p className="text-sm text-muted-foreground">
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

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <label className="font-medium">Push Notifications</label>
                </div>
                <p className="text-sm text-muted-foreground">
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
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-sm font-medium text-muted-foreground">Pushover User Key</label>
                <Input
                  value={settings.pushoverUserKey}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, pushoverUserKey: e.target.value }))
                  }
                  placeholder="Your Pushover user key"
                  className="bg-white/5 border-white/10 rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* MCP Tokens */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">MCP Integration</h2>
              <p className="text-sm text-muted-foreground">Manage LLM access to your tasks</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Create MCP tokens to allow LLMs (like Claude, GPT, etc.) to access and manage your tasks.
            You can create multiple tokens with different permissions.
          </p>
          <Link
            href="/settings/mcp"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all duration-200"
          >
            Manage MCP Tokens
          </Link>
        </div>

        {/* Admin Settings Link (only for admins) */}
        {session?.user?.isAdmin && (
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Administration</h2>
                <p className="text-sm text-muted-foreground">Family-wide settings</p>
              </div>
            </div>
            <Link
              href="/settings/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all duration-200"
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
