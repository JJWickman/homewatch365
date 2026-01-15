import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Users, Building2, ClipboardCheck, Calendar, 
  FileText, Settings, Menu, X, LogOut, ChevronDown,
  Bell, Search, Plus, Building, UserCircle, Megaphone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Properties', icon: Building2, page: 'Properties' },
  { name: 'Inspections', icon: ClipboardCheck, page: 'Inspections' },
  { name: 'Schedule', icon: Calendar, page: 'Schedule' },
  { name: 'Tasks', icon: FileText, page: 'Tasks' },
  { name: 'Issues', icon: Bell, page: 'Issues' },
  { name: 'Contractors', icon: Briefcase, page: 'Contractors' },
  { name: 'Marketing', icon: Megaphone, page: 'Marketing' },
];

const clientPortalPages = ['ClientPortal', 'ClientInspectionView'];
const publicPages = ['CompanyOnboarding', 'ClientLogin'];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [company, setCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Subscribe to company updates
    if (companyMember?.company_id) {
      const unsubscribe = base44.entities.Company.subscribe((event) => {
        if (event.type === 'update' && event.id === companyMember.company_id) {
          setCompany(event.data);
        }
      });
      return unsubscribe;
    }
  }, [companyMember?.company_id]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load company membership
      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        setCompanyMember(members[0]);
        // Load company details
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companies.length > 0) {
          setCompany(companies[0]);
        }
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Client portal layout
  if (clientPortalPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  // Public pages (no layout)
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded" />
              ) : (
                <div className="h-8 w-8 rounded bg-amber-500 flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="font-semibold text-white truncate">
                {company?.name || 'Estate Watch'}
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings & User */}
          <div className="p-3 border-t border-slate-800">
            <Link
              to={createPageUrl('Settings')}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentPageName === 'Settings' 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden text-slate-600"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-64">
                <Search className="h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-900 text-white text-xs">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{companyMember?.role || 'Member'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      <style>{`
        :root {
          --primary: ${company?.primary_color || '#1e3a5f'};
          --accent: ${company?.accent_color || '#c9a962'};
        }
      `}</style>
    </div>
  );
}