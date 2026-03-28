'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Shield, Bell, Mail, UserPlus, Users } from 'lucide-react';

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage family-wide settings and members
          </p>
        </div>

        {/* Family Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Family Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Family Name</label>
              <Input
                value={settings?.name || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Family name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Global Notification Settings</CardTitle>
            </div>
            <CardDescription>Default notification settings for the family</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pushover App Token</label>
              <Input
                value={settings?.pushoverAppToken || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, pushoverAppToken: e.target.value } : null)}
                placeholder="Pushover app token"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pushover User Key</label>
              <Input
                value={settings?.pushoverUserKey || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, pushoverUserKey: e.target.value } : null)}
                placeholder="Pushover user key"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Resend API Key
              </label>
              <Input
                value={settings?.resendApiKey || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, resendApiKey: e.target.value } : null)}
                placeholder="Resend API key"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From Email</label>
              <Input
                type="email"
                value={settings?.resendFromEmail || ''}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, resendFromEmail: e.target.value } : null)}
                placeholder="noreply@yourdomain.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Family Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Family Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {settings?.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {member.isAdmin && (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                </div>
              ))}
            </div>

            {isAddingMember ? (
              <div className="space-y-3 pt-4 border-t">
                <p className="font-medium">Add New Member</p>
                <Input
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newMember.password}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, password: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddMember}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setIsAddingMember(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
