import React from 'react';
import ProductServiceWizard from '@/components/settings/ProductServiceWizard';
import PageHeader from '@/components/shared/PageHeader';

export default function SettingsProducts() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Products & Services"
        subtitle="Configure the services you offer to clients"
      />
      <ProductServiceWizard />
    </div>
  );
}