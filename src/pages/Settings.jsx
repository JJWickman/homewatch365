import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Building, Shield, FileText, Zap, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/shared/PageHeader';

export default function SettingsHub() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'My Profile',
      description: 'Update your personal information, password, and addresses',
      icon: User,
      color: 'bg-blue-50',
      path: '/SettingsProfile'
    },
    {
      title: 'Company',
      description: 'Manage company name, logo, branding, and business profiles',
      icon: Building,
      color: 'bg-green-50',
      path: '/SettingsCompany'
    },
    {
      title: 'Administration',
      description: 'Manage team members, billing, integrations, and advanced settings',
      icon: Shield,
      color: 'bg-purple-50',
      path: '/SettingsAdmin'
    },
    {
      title: 'Subscription',
      description: 'View and manage your subscription plan and billing',
      icon: Zap,
      color: 'bg-amber-50',
      path: '/SettingsSubscription'
    },
    {
      title: 'Products & Services',
      description: 'Configure pricing, visit types, and service offerings',
      icon: FileText,
      color: 'bg-indigo-50',
      path: '/SettingsFinancial'
    },
    {
      title: 'Templates',
      description: 'Create and manage inspection checklist templates',
      icon: Palette,
      color: 'bg-pink-50',
      path: '/SettingsTemplates'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and company settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.path} 
              className="cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => navigate(section.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-lg ${section.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Open Settings →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}