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
  Check,
  Users,
  Cpu,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
  { name: 'Lists', href: '/lists', icon: ListTodo, color: 'bg-purple-500' },
];

const bottomNavigation = [
  { name: 'MCP Tokens', href: '/settings/mcp', icon: Cpu, color: 'bg-primary' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'bg-primary' },
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

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-card m-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            S
          </div>
          <span className="font-bold text-xl text-foreground">sTOobyDOo</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col glass-card rounded-3xl p-6">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                S
              </div>
              <span className="font-bold text-2xl text-foreground">
                sTOobyDOo
              </span>
            </div>

            {/* User info */}
            <div className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {getInitials(session?.user?.name || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom navigation */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              {bottomNavigation.map((item) => {
                const isActive = item.href === '/settings' 
                  ? pathname === '/settings' || pathname === '/settings/admin'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {item.name}
                  </Link>
                );
              })}

              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </div>
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-lg bg-red-500 flex items-center justify-center text-white">
                  <LogOut className="h-4 w-4" />
                </div>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
