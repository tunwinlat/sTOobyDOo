'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Shield, Bell, Mail, UserPlus, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FamilySettings {
  name: string;
  pushoverAppToken: string;
  pushoverUserKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  }>;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<FamilySettings | null>(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        router.push('/settings');
        return;
      }
      fetchSettings();
    }
  }, [status, router, session]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
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

  const handleAddMember = async () => {
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });

      if (res.ok) {
        const member = await res.json();
        setSettings((prev) => prev ? { ...prev, members: [...prev.members, member] } : null);
        setNewMember({ name: '', email: '', password: '' });
        setIsAddingMember(false);
      }
    } catch (error) {
      console.error('Failed to add member:', error);
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

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
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
              Admin Settings
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage family-wide settings and members
            </p>
          </div>
        </div>

        {/* Family Info */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">Family Information</h2>
              <p className="text-xs text-muted-foreground">Your family name</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Family Name</label>
            <Input
              value={settings?.name || ''}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Family name"
              className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Global Notifications */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">Notification Settings</h2>
              <p className="text-xs text-muted-foreground">Global notification configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Pushover App Token</label>
              <Input
                value={settings?.pushoverAppToken || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, pushoverAppToken: e.target.value } : null)}
                placeholder="Pushover app token"
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Pushover User Key</label>
              <Input
                value={settings?.pushoverUserKey || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, pushoverUserKey: e.target.value } : null)}
                placeholder="Pushover user key"
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Resend API Key
              </label>
              <Input
                value={settings?.resendApiKey || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, resendApiKey: e.target.value } : null)}
                placeholder="Resend API key"
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From Email</label>
              <Input
                type="email"
                value={settings?.resendFromEmail || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, resendFromEmail: e.target.value } : null)}
                placeholder="noreply@yourdomain.com"
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">Family Members</h2>
              <p className="text-xs text-muted-foreground">Manage family members</p>
            </div>
          </div>
          <div className="space-y-2">
            {settings?.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                {member.isAdmin && (
                  <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/[0.06] text-foreground border border-white/[0.1]">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>

          {isAddingMember ? (
            <div className="space-y-3 pt-4 border-t border-white/[0.06] mt-4">
              <p className="font-medium text-sm">Add New Member</p>
              <Input
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
              <Input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
              <Input
                type="password"
                placeholder="Password"
                value={newMember.password}
                onChange={(e) => setNewMember((prev) => ({ ...prev, password: e.target.value }))}
                className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
              />
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-white text-sm font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </button>
                <button 
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingMember(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 mt-4 rounded-xl btn-ghost text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </button>
          )}
        </div>

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
