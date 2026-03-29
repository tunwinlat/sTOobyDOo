'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Cpu,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Lists', href: '/lists', icon: ListTodo },
];

const bottomNavigation = [
  { name: 'MCP Tokens', href: '/settings/mcp', icon: Cpu },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings' || pathname === '/settings/admin';
    }
    if (href === '/settings/mcp') {
      return pathname === '/settings/mcp';
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-card m-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-sm border border-white/10">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight">sTOobyDOo</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 p-4 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col glass-card rounded-2xl p-5">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 mb-8 px-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold border border-white/10">
                S
              </div>
              <span className="font-semibold text-xl tracking-tight">
                sTOobyDOo
              </span>
            </div>

            {/* User info */}
            <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-medium text-sm border border-white/10">
                  {getInitials(session?.user?.name || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'nav-active text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom navigation */}
            <div className="space-y-1 pt-4 border-t border-white/[0.06]">
              {bottomNavigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'nav-active text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    {item.name}
                  </Link>
                );
              })}

              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all duration-200"
              >
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
