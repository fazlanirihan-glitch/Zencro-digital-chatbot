'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, LogOut, Users, MessageSquare, BarChart3, 
  HelpCircle, Briefcase, FileText, Settings, Palette
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const activeToken = localStorage.getItem('zencro_admin_token');
    if (!activeToken) {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('zencro_admin_token');
    router.push('/admin/login');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Analytics', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Leads CRM', href: '/admin/dashboard/leads', icon: Users },
    { name: 'Conversations', href: '/admin/dashboard/chats', icon: MessageSquare },
    { name: 'Knowledge', href: '/admin/dashboard/knowledge', icon: FileText },
    { name: 'FAQs', href: '/admin/dashboard/faqs', icon: HelpCircle },
    { name: 'Portfolio', href: '/admin/dashboard/portfolio', icon: Briefcase },
    { name: 'Branding', href: '/admin/dashboard/branding', icon: Palette },
    { name: 'Tenants', href: '/admin/dashboard/companies', icon: Users },
    { name: 'Prompts', href: '/admin/dashboard/prompts', icon: Settings },
    { name: 'Alerts', href: '/admin/dashboard/notifications', icon: MessageSquare },
    { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-900/60 p-6 flex flex-col space-y-6 flex-shrink-0">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-900">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-100">ZenCro Admin</span>
            <div className="text-[10px] text-blue-400">Control Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match for root dashboard, startsWith for others
            const isActive = item.href === '/admin/dashboard' 
              ? pathname === '/admin/dashboard' 
              : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.name}
                href={item.href}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/20 rounded-xl transition-colors mt-auto"
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
