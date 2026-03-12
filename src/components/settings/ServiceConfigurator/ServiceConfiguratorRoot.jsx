import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Package, DollarSign, Plus } from 'lucide-react';
import ServiceBasicInfo from './sections/ServiceBasicInfo';
import PricingModelSelector from './sections/PricingModelSelector';
import TierBuilder from './sections/TierBuilder';
import AddOnManager from './sections/AddOnManager';
import ServicePreview from './sections/ServicePreview';

export default function ServiceConfiguratorRoot({ companyId, onSave, initialService = null }) {
  const [service, setService] = useState(initialService || {
    name: '',
    description: '',
    type: 'subscription', // subscription | addon
    pricing_model: 'flat_rate', // flat_rate | tiered | usage_based
    base_price: '',
    billing_frequency: 'monthly', // monthly | quarterly | annually | one_time
    is_active: true,
    pricing_tiers: [],
    usage_unit: '',
    add_ons: []
  });

  const [activeTab, setActiveTab] = useState('basic');

  const handleServiceUpdate = useCallback((updates) => {
    setService(prev => ({ ...prev, ...updates }));
  }, []);

  const isValid = {
    basic: service.name && service.type,
    pricing: service.base_price,
    tiers: service.pricing_model !== 'tiered' || (service.pricing_tiers?.length > 0),
    complete: service.name && service.type && service.base_price
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Pricing</span>
              </TabsTrigger>
              <TabsTrigger value="tiers" disabled={service.pricing_model !== 'tiered'} className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Tiers</span>
              </TabsTrigger>
              <TabsTrigger value="addons" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add-ons</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <ServiceBasicInfo 
                service={service}
                onUpdate={handleServiceUpdate}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <PricingModelSelector 
                service={service}
                onUpdate={handleServiceUpdate}
              />
            </TabsContent>

            <TabsContent value="tiers" className="space-y-4">
              {service.pricing_model === 'tiered' && (
                <TierBuilder 
                  tiers={service.pricing_tiers || []}
                  onUpdate={(tiers) => handleServiceUpdate({ pricing_tiers: tiers })}
                />
              )}
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <AddOnManager 
                addOns={service.add_ons || []}
                onUpdate={(addOns) => handleServiceUpdate({ add_ons: addOns })}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview & Summary */}
      <ServicePreview 
        service={service}
        onSave={onSave}
        isValid={isValid.complete}
        companyId={companyId}
      />
    </div>
  );
}