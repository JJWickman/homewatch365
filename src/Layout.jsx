import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import OfflineProvider from '@/components/shared/OfflineProvider';
import OfflineBanner from '@/components/shared/OfflineBanner';
import { 
        Home, Users, Building2, ClipboardCheck, Calendar, 
        FileText, Settings, Menu, X, LogOut, ChevronDown,
        Bell, Search, Plus, Building, UserCircle, Megaphone, Briefcase, Route, BookOpen, DollarSign
      } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import TrialBanner from '@/components/subscription/TrialBanner';

const getPageRestrictions = () => {
  return {
    'Marketing': 'enterprise_or_addon'
  };
};

const getNavigationItems = (subscriptionPlan, memberRole) => {
// Field Inspector - limited access (includes backward compatibility for 'technician')
if (memberRole === 'field_inspector' || memberRole === 'technician') {
  const items = [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'My Visits', icon: ClipboardCheck, page: 'Inspections' },
    { name: 'My Schedule', icon: Calendar, page: 'Schedule' }
  ];
  
  // Add Route Optimizer for field inspectors if company has growth+ subscription
  if (['growth', 'professional', 'enterprise'].includes(subscriptionPlan)) {
    items.push({ name: 'Route Optimizer', icon: Route, page: 'RouteOptimizer' });
  }
  
  return items;
}

// Dispatcher/Manager and Administrator - full access
const baseItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Properties', icon: Building2, page: 'Properties' },
  { name: 'Visits', icon: ClipboardCheck, page: 'Inspections' },
  { name: 'Schedule', icon: Calendar, page: 'Schedule' },
  { name: 'Contractors', icon: Briefcase, page: 'Contractors' },
  { name: 'Route Optimizer', icon: Route, page: 'RouteOptimizer' },
  { name: 'Help & Tutorials', icon: BookOpen, page: 'HelpTutorials' },
];

// Only show Billing for Administrators
if (memberRole === 'administrator' || memberRole === 'owner') {
  baseItems.splice(7, 0, { name: 'Billing', icon: DollarSign, page: 'Billing' });
}

// Show Marketing for Enterprise plan or if add-on is active
// Note: company object needed to check marketing_addon_active
// This will be checked in the layout component itself

return baseItems;
};

const clientPortalPages = ['ClientPortal', 'ClientInspectionView'];
const publicPages = ['CompanyOnboarding', 'ClientLogin', 'Home'];

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

  useEffect(() => {
    // Verify user still exists every 30 seconds
    if (!user) return;

    const verifyUserExists = async () => {
      try {
        await base44.auth.me();
      } catch (error) {
        // User has been deleted, log them out
        base44.auth.logout();
      }
    };

    const interval = setInterval(verifyUserExists, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user has a company - if not, they need onboarding
      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });

      // If user has no company and not already on onboarding page, redirect to onboarding
      if (members.length === 0 && currentPageName !== 'CompanyOnboarding') {
        navigate(createPageUrl('CompanyOnboarding'));
        return;
      }

      // If user has onboarding_completed field, check it
      if (currentUser.onboarding_completed !== true && members.length > 0 && currentPageName !== 'CompanyOnboarding') {
        navigate(createPageUrl('CompanyOnboarding'));
        return;
      }
      
      // Load company membership (reuse members already fetched)
      setCompanyMember(members[0]);
      // Load company details
      const companies = await base44.entities.Company.filter({ id: members[0].company_id });
      if (companies.length > 0) {
        setCompany(companies[0]);
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
      <OfflineProvider>
        <div className="min-h-screen bg-slate-50">
          <OfflineBanner />
          {children}
        </div>
      </OfflineProvider>
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

  const hasMarketingAccess = company?.subscription_plan === 'enterprise' || company?.marketing_addon_active === true;
  const isAdminOrOwner = companyMember?.role === 'administrator' || companyMember?.is_owner === true;

  let navigationItems = getNavigationItems(company?.subscription_plan, companyMember?.role);

  // Add CRM & Marketing if company has access AND (user is admin/owner OR has explicit permission)
  if (hasMarketingAccess && (isAdminOrOwner || companyMember?.crm_marketing_access === true)) {
    const hasMarketing = navigationItems.some(item => item.name === 'CRM & Marketing');
    if (!hasMarketing) {
      navigationItems.push({ name: 'CRM & Marketing', icon: Megaphone, page: 'Marketing' });
    }
  }

  const pageRestrictions = getPageRestrictions();
  const hasMarketingAccessForPage = company?.subscription_plan === 'enterprise' || company?.marketing_addon_active === true;
  const isPageRestricted = pageRestrictions[currentPageName] === 'enterprise_or_addon' && !hasMarketingAccessForPage;
  const isAdmin = companyMember?.role === 'administrator' || companyMember?.role === 'admin';

  return (
    <OfflineProvider>
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-950 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center">
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
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-slate-300 hover:text-white hover:bg-blue-800'}
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings & User */}
          <div className="p-3 border-t border-blue-800">
            <Link
              to={createPageUrl('Settings')}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentPageName === 'Settings' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'text-slate-300 hover:text-white hover:bg-blue-800'}
              `}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>

          {/* Estate Watch 365 Footer */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-center mb-3">
              <a 
                href="https://www.estatewatch365.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/c534cf318_NewEstateWatchLogo.png" 
                  alt="Estate Watch 365" 
                  className="h-20 w-auto object-contain" 
                />
              </a>
            </div>
            <a
              href="#support"
              className="flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-green-600 transition-colors"
            >
              <span>Support</span>
              <span className="text-slate-400">→</span>
            </a>
          </div>
          </div>
          </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden text-slate-600 shrink-0"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 max-w-xs flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent text-sm outline-none w-full min-w-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  </div>
                  <div className="py-6 text-center text-sm text-slate-500">
                    No notifications
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {getInitials(user?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{companyMember?.user_name || user?.full_name}</p>
                      <p className="text-xs text-slate-500 capitalize truncate">{companyMember?.role || 'Member'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{companyMember?.user_name || user?.full_name}</p>
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
        <main className="p-4 lg:p-6 min-w-0 overflow-x-hidden">
          <TrialBanner company={company} companyMember={companyMember} />
          {isPageRestricted && isAdmin && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Restricted Access:</strong> This feature requires the CRM & Marketing add-on ($99/mo) or an Enterprise subscription. 
                <a href={createPageUrl('Settings')} className="underline ml-1 font-medium hover:text-blue-700">
                  Manage subscription
                </a>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>

      <style>{`
        :root {
          --primary: ${company?.primary_color || '#1e3a5f'};
          --accent: ${company?.accent_color || '#c9a962'};
        }

        /* Glassy Modern Theme */
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-attachment: fixed;
        }

        /* Glass cards */
        [class*="Card"] {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
        }

        /* Glass inputs and selects */
        input, select, textarea, [role="combobox"] {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* Glass sidebar */
        aside {
          background: rgba(30, 58, 95, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        /* Glass header */
        header {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* Glass dialogs */
        [role="dialog"] > div:first-child {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(30px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2) !important;
        }

        /* Glass buttons */
        button {
          backdrop-filter: blur(10px) !important;
          transition: all 0.3s ease !important;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        }

        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Glass badges */
        [class*="badge"] {
          background: rgba(255, 255, 255, 0.5) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* Animations */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
      </div>
      </OfflineProvider>
      );
      }