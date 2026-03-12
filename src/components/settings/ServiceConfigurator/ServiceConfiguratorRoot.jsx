import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from 'lucide-react';
import PricingConfigurationBuilder from './sections/PricingConfigurationBuilder';
import PricingConfigurationPreview from './sections/PricingConfigurationPreview';

export default function ServiceConfiguratorRoot({ companyId, onSave }) {
  const [config, setConfig] = useState({
    base_price: 60,
    water_zone_price: 15,
    visit_frequencies: [
      { id: 'freq_1', label: '4-5 per Month', visits_per_month: 4.5, is_active: true },
      { id: 'freq_2', label: '3 per Month', visits_per_month: 3, is_active: true },
      { id: 'freq_3', label: '2 per Month', visits_per_month: 2, is_active: true }
    ],
    add_ons: [
      { id: 'addon_1', name: 'Vendor Key-In Service', price: 60, unit: 'per service', is_active: true },
      { id: 'addon_2', name: 'Concierge Services', price: 60, unit: 'per hour', is_active: true },
      { id: 'addon_3', name: 'Car Drive', price: 45, unit: 'per car/per drive', is_active: true },
      { id: 'addon_4', name: 'Handyman Service and Cleaning', price: null, unit: 'as incurred', is_active: true },
      { id: 'addon_5', name: 'Emergency Visits', price: null, unit: 'tiered by time', is_active: true },
      { id: 'addon_6', name: 'Pre & Post-Storm Visit', price: 75, unit: 'per visit', is_active: true }
    ]
  });

  const handleConfigUpdate = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Configuration Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PricingConfigurationBuilder 
            config={config}
            onUpdate={handleConfigUpdate}
          />
        </CardContent>
      </Card>

      <PricingConfigurationPreview 
        config={config}
        onSave={onSave}
        companyId={companyId}
      />
    </div>
  );
}