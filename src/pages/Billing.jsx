import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import BillingOverview from '@/components/admin/BillingOverview';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

export default function Billing() {
  const [tenantId, setTenantId] = useState(null);
  const [tenantUser, setTenantUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser?.primary_tenant_id) { setLoading(false); return; }
      setTenantId(currentUser.primary_tenant_id);
      const tenantUsers = await base44.entities.TenantUser.filter({
        user_id: currentUser.id,
        tenant_id: currentUser.primary_tenant_id
      });
      if (tenantUsers.length > 0) setTenantUser(tenantUsers[0]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!tenantUser || (tenantUser.role_in_tenant !== 'admin' && !tenantUser.is_owner)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Billing" subtitle="Billing and revenue overview" />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Access Denied</p>
                <p className="text-sm text-amber-800 mt-1">Only administrators can access billing.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Billing" subtitle="Revenue and billing overview" />
      <BillingOverview companyId={tenantId} />
    </div>
  );
}