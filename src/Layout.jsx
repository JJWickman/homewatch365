import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import OfflineProvider from '@/components/shared/OfflineProvider';
import OfflineBanner from '@/components/shared/OfflineBanner';
import FloatingChatWidget from '@/components/support/FloatingChatWidget';
import {
  Home, Users, Building2, ClipboardCheck, Calendar,
  FileText, Settings, Menu, X, LogOut, ChevronDown,
  Bell, Search, Plus, Building, UserCircle, Megaphone, Briefcase, BookOpen, DollarSign, Download, Bot, MessageSquare } from
'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
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

const getNavigationItems = (subscriptionPlan, roleInTenant, globalRole) => {
  // Superadmins bypass tenant role check
  if (globalRole === 'superadmin' || globalRole === 'admin') {
    roleInTenant = 'admin';
  }
  const role = roleInTenant || 'field_inspector';

  // Field Reporter - limited access
  if (role === 'field_inspector') {
    return [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'My Visits', icon: ClipboardCheck, page: 'Visits' },
    { name: 'My Schedule', icon: Calendar, page: 'Schedule' }];

  }

  // Dispatcher/Admin - full access
  const baseItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Properties', icon: Building2, page: 'Properties' },
  { name: 'Visits', icon: ClipboardCheck, page: 'Visits' },
  { name: 'Schedule', icon: Calendar, page: 'Schedule' },
  { name: 'Contractors', icon: Briefcase, page: 'Contractors' },
  { name: 'Help & Tutorials', icon: BookOpen, page: 'HelpTutorials' },
  { name: 'AI Assistant', icon: Bot, page: 'AIAssistant' }];


  // Only show Billing and Import Data for Admins
  if (role === 'admin') {
    baseItems.splice(7, 0, { name: 'Billing', icon: DollarSign, page: 'Billing' });
    baseItems.splice(8, 0, { name: 'Import Data', icon: Download, page: 'ImportData' });
  }

  return baseItems;
};

const clientPortalPages = ['ClientPortal', 'ClientInspectionView'];
const publicPages = ['CompanyOnboarding', 'ClientLogin', 'Home'];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [tenantUser, setTenantUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (company?.id) {
      const unsubscribe = base44.entities.Tenant.subscribe((event) => {
        if (event.type === 'update' && event.id === company.id) {
          setCompany(event.data);
        }
      });
      return unsubscribe;
    }
  }, [company?.id]);

  useEffect(() => {
    if (!user) return;

    const verifyUserExists = async () => {
      try {
        await base44.auth.me();
      } catch (error) {
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

      // Check if user has primary_tenant_id (completed onboarding)
      if (!currentUser.primary_tenant_id) {
        setLoading(false);
        if (currentPageName !== 'CompanyOnboarding') {
          navigate(createPageUrl('CompanyOnboarding'));
        }
        return;
      }

      // Load TenantUser (role/permissions)
      const tenantUsers = await base44.entities.TenantUser.filter({
        user_id: currentUser.id,
        tenant_id: currentUser.primary_tenant_id
      });
      if (tenantUsers.length > 0) {
        setTenantUser(tenantUsers[0]);
      }

      // Load tenant
      const tenants = await base44.entities.Tenant.filter({ id: currentUser.primary_tenant_id });
      if (tenants.length > 0) setCompany(tenants[0]);
    } catch (error) {
      console.error('Error loading user data:', error);
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
      </OfflineProvider>);

  }

  // Public pages (no layout)
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Subscription gate — block access if no valid trial or active subscription
  // Bypass for: platform admins/superadmins, OR invited tenant members (have a tenantUser record)
  const isBypassUser = user?.role === 'superadmin' || user?.role === 'admin' || !!tenantUser;
  if (!loading && company && !isBypassUser) {
    const status = company.subscription_status;
    const trialExpired = status === 'trial' && company.trial_ends_at && new Date(company.trial_ends_at) < new Date();
    const isBlocked = status === 'cancelled' || trialExpired || (!status);

    if (isBlocked) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Subscription Required</h2>
            <p className="text-blue-200 text-sm mb-6">
              {status === 'cancelled'
                ? 'Your subscription has been cancelled.'
                : 'Your free trial has expired.'}
              {' '}Please upgrade to continue using Home Watch 365.
            </p>
            <a
              href="https://www.estatewatch365.com"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              Upgrade Now
            </a>
            <div className="mt-4">
              <button onClick={() => base44.auth.logout()} className="text-sm text-blue-300 hover:text-white underline">
                Sign out
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const hasMarketingAccess = company?.subscription_plan === 'enterprise' ||
  company?.marketing_addon_active === true ||
  ['solopreneur_crm', 'growth_crm', 'professional_crm'].includes(company?.subscription_plan);
  const isAdminOrOwner = tenantUser?.role_in_tenant === 'admin' || tenantUser?.is_owner === true;

  let navigationItems = getNavigationItems(company?.subscription_plan, tenantUser?.role_in_tenant, user?.role);

  // Add CRM & Marketing if company has access AND user is admin/owner
  if (hasMarketingAccess && isAdminOrOwner) {
    const hasMarketing = navigationItems.some((item) => item.name === 'CRM & Marketing');
    if (!hasMarketing) {
      navigationItems.push({ name: 'CRM & Marketing', icon: Megaphone, page: 'Marketing' });
    }
  }

  const pageRestrictions = getPageRestrictions();
  const hasMarketingAccessForPage = company?.subscription_plan === 'enterprise' || company?.marketing_addon_active === true;
  const isPageRestricted = pageRestrictions[currentPageName] === 'enterprise_or_addon' && !hasMarketingAccessForPage;
  const isAdmin = tenantUser?.role_in_tenant === 'admin';

  return (
    <OfflineProvider>
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen &&
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />

        }

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-950 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            {company?.logo_url ?
                <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded object-contain bg-white/10" /> :

                <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {company?.name ? company.name.charAt(0).toUpperCase() : <Building className="h-5 w-5 text-white" />}
                </span>
              </div>
                }
              <span className="font-semibold text-white truncate">
                {company?.name || 'My Tenant'}
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
                    to={item.page === 'Settings' ? createPageUrl('Settings') + '?tab=templates' : createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ?
                    'bg-green-500/20 text-green-400' :
                    'text-slate-300 hover:text-white hover:bg-blue-800'}
                  `}>
                    
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>);

              })}
          </nav>

          {/* Settings & User */}
          <div className="p-3 border-t border-blue-800">
            <Link
                to={createPageUrl('Settings')}
                onClick={() => setSidebarOpen(false)}
                className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentPageName === 'Settings' ?
                'bg-green-500/20 text-green-400' :
                'text-slate-300 hover:text-white hover:bg-blue-800'}
              `}>
                
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>

          {/* Home Watch 365 Footer */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-center mb-3">
              <a
                  href="https://www.estatewatch365.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity">
                  
                <img src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/c920e3364_NewHomeWatch365logo.png"

                  alt="Home Watch 365" className="w-auto object-contain" style={{height: '104px'}} />

                  
              </a>
            </div>
            <a
                href="#support"
                className="flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-green-600 transition-colors">
                
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
                  className="lg:hidden text-slate-600 shrink-0">
                  
                <Menu className="h-6 w-6" />
              </button>

              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 max-w-xs flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent text-sm outline-none w-full min-w-0" />
                  
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
                    {user?.show_certification_badge && (
                      <img
                        src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/9369557c5_image.png"
                        alt="Certified Home Watch Reporter"
                        className="h-8 w-auto object-contain shrink-0"
                      />
                    )}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{[user?.first_name, user?.last_name].filter(Boolean).join(' ')}</p>
                      <p className="text-xs text-slate-500 capitalize truncate">{tenantUser?.role_in_tenant === 'field_inspector' ? 'Field Reporter' : tenantUser?.role_in_tenant || 'Member'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings') + '?tab=profile'}>
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
          <TrialBanner company={company} tenantUser={tenantUser} />
          {isPageRestricted && isAdmin &&
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Restricted Access:</strong> This feature requires the CRM & Marketing add-on ($99/mo) or an Enterprise subscription. 
                <a href={createPageUrl('Settings')} className="underline ml-1 font-medium hover:text-blue-700">
                  Manage subscription
                </a>
              </AlertDescription>
            </Alert>
            }
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
        main [class*="Card"], main [class*="card"] {
          background: rgba(240, 248, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(147, 197, 253, 0.4) !important;
          box-shadow: 0 8px 32px 0 rgba(30, 58, 95, 0.15) !important;
        }

        /* Glass inputs and selects — but NOT switch or its children */
        main input:not([role="switch"]):not([data-state]),
        main select,
        main textarea,
        main [role="combobox"] {
          background: rgba(219, 234, 254, 0.4) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(147, 197, 253, 0.5) !important;
        }

        /* Glass dialogs */
        [role="dialog"] > div:first-child {
          background: rgba(219, 234, 254, 0.75) !important;
          backdrop-filter: blur(30px) !important;
          border: 1px solid rgba(147, 197, 253, 0.4) !important;
          box-shadow: 0 8px 32px 0 rgba(30, 58, 95, 0.2) !important;
        }

        /* Glass dropdowns and popovers */
        [data-radix-popper-content-wrapper] > div {
          background: rgba(219, 234, 254, 0.85) !important;
          backdrop-filter: blur(20px) !important;
        }

        /* Glass tables */
        table, tr, td, th {
          background: transparent !important;
        }

        /* Protect switch toggle — restore Radix UI defaults */
        button[role="switch"] {
          background-color: #e2e8f0 !important;
          backdrop-filter: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        button[role="switch"][data-state="checked"] {
          background-color: #0f172a !important;
        }
        button[role="switch"] span {
          background-color: white !important;
          backdrop-filter: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Protect colored icon containers with inline styles */
        [style*="background"] {
          backdrop-filter: none !important;
        }

        /* Glass buttons (non-switch) */
        button:not([role="switch"]) {
          backdrop-filter: blur(10px) !important;
          transition: all 0.3s ease !important;
        }

        button:not([role="switch"]):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(30, 58, 95, 0.2) !important;
        }

        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(219, 234, 254, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(147, 197, 253, 0.5);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 197, 253, 0.8);
        }

        /* Animations */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
      <FloatingChatWidget />
      </div>
      </OfflineProvider>);

}