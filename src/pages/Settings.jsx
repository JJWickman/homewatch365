import React from 'react';
import { User, Building, Shield, Palette, CreditCard, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';
import SettingsProfile from './SettingsProfile';
import SettingsCompany from './SettingsCompany';
import SettingsAdmin from './SettingsAdmin';

import SettingsSubscription from './SettingsSubscription';
import SettingsTemplates from './SettingsTemplates';
import SettingsProducts from './SettingsProducts';

export default function Settings() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and company settings"
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </TabsTrigger>

          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SettingsProfile />
        </TabsContent>

        <TabsContent value="company">
          <SettingsCompany />
        </TabsContent>

        <TabsContent value="billing">
          <SettingsSubscription />
        </TabsContent>

        <TabsContent value="admin">
          <SettingsAdmin />
        </TabsContent>



        <TabsContent value="templates">
          <SettingsTemplates />
        </TabsContent>

        <TabsContent value="products">
          <SettingsProducts />
        </TabsContent>
      </Tabs>
    </div>
  );
}