import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Wrench, ArrowRight, ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function ProductServiceWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null); // 'product' or 'service'
  const [serviceType, setServiceType] = useState(null); // 'one_time' or 'recurring'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    visitsPerMonth: 4,
    preStormIncluded: false,
    postStormIncluded: false,
    preStormQuantity: 12,
    postStormQuantity: 12,
    followUpsIncluded: 0
  });

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setStep(2);
  };

  const handleNext = () => {
    if (step === 2 && type === 'product') {
      // Validate product fields
      if (!formData.name || !formData.price) {
        alert('Please fill in all required fields');
        return;
      }
      // Complete the wizard for products
      onComplete({
        type: 'addon',
        billing_frequency: 'one_time',
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_active: true
      });
    } else if (step === 2 && type === 'service') {
      // Validate service basic fields
      if (!formData.name || !formData.description) {
        alert('Please fill in all required fields');
        return;
      }
      setStep(3);
    } else if (step === 3 && type === 'service') {
      setStep(4);
    } else if (step === 4 && type === 'service') {
      // Validate and complete
      if (!formData.price) {
        alert('Please enter a price');
        return;
      }

      // Determine inspection frequency based on visits per month
      let inspectionFrequency = 'weekly';
      if (serviceType === 'recurring') {
        if (formData.visitsPerMonth <= 1) inspectionFrequency = 'monthly';
        else if (formData.visitsPerMonth === 2) inspectionFrequency = 'bi_weekly';
        else inspectionFrequency = 'weekly';
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_active: true
      };

      if (serviceType === 'one_time') {
        onComplete({
          ...serviceData,
          type: 'addon',
          billing_frequency: 'one_time'
        });
      } else {
        onComplete({
          ...serviceData,
          type: 'subscription',
          billing_frequency: 'monthly',
          inspection_frequency: inspectionFrequency,
          included_pre_storm_visits: formData.preStormIncluded ? formData.preStormQuantity : 0,
          included_post_storm_visits: formData.postStormIncluded ? formData.postStormQuantity : 0
        });
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setType(null);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 4) {
      setStep(3);
      setServiceType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">What would you like to add?</h3>
            <p className="text-sm text-slate-600">Choose the type of item you want to create</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelect('product')}
              className="p-6 border-2 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">Product</h4>
              <p className="text-sm text-slate-600">One-time purchase items</p>
            </button>

            <button
              onClick={() => handleTypeSelect('service')}
              className="p-6 border-2 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                <Wrench className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Service</h4>
              <p className="text-sm text-slate-600">Recurring subscription plans</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product Details */}
      {step === 2 && type === 'product' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Package className="h-4 w-4" />
            <span>Adding a Product</span>
          </div>

          <div>
            <Label>Product Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Emergency Repair Kit"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Product Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the product..."
              className="min-h-24 mt-1"
            />
          </div>

          <div>
            <Label>Product Price *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!formData.name || !formData.price}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Add Product
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Service Basic Info */}
      {step === 2 && type === 'service' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Wrench className="h-4 w-4" />
            <span>Adding a Service - Step 1 of 3</span>
          </div>

          <div>
            <Label>Service Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Weekly Property Inspection"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Service Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this service includes..."
              className="min-h-24 mt-1"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!formData.name || !formData.description}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Service Type Selection */}
      {step === 3 && type === 'service' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Wrench className="h-4 w-4" />
            <span>Adding a Service - Step 2 of 3</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Service Type</h3>
            <p className="text-sm text-slate-600 mb-4">Is this a recurring subscription or a one-time service?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setServiceType('recurring');
                setStep(4);
              }}
              className="p-6 border-2 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Monthly/Recurring</h4>
              <p className="text-sm text-slate-600">Subscription-based service</p>
            </button>

            <button
              onClick={() => {
                setServiceType('one_time');
                setStep(4);
              }}
              className="p-6 border-2 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">One-Time</h4>
              <p className="text-sm text-slate-600">Single service purchase</p>
            </button>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Service Details - One-Time */}
      {step === 4 && type === 'service' && serviceType === 'one_time' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Clock className="h-4 w-4" />
            <span>One-Time Service - Step 3 of 3</span>
          </div>

          <div>
            <Label>Cost *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!formData.price}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Add Service
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Service Details - Recurring */}
      {step === 4 && type === 'service' && serviceType === 'recurring' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span>Monthly/Recurring Service - Step 3 of 3</span>
          </div>

          <div>
            <Label>Monthly Cost *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <Label>Number of Visits per Month Included</Label>
            <Input
              type="number"
              min="0"
              value={formData.visitsPerMonth}
              onChange={(e) => setFormData({ ...formData, visitsPerMonth: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pre-storm"
                  checked={formData.preStormIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, preStormIncluded: checked })}
                />
                <label htmlFor="pre-storm" className="text-sm font-medium cursor-pointer">
                  Pre-Storm Visits Included
                </label>
              </div>
              {formData.preStormIncluded && (
                <div className="ml-6">
                  <Label className="text-xs">Quantity per Year</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.preStormQuantity}
                    onChange={(e) => setFormData({ ...formData, preStormQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-32"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-storm"
                  checked={formData.postStormIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, postStormIncluded: checked })}
                />
                <label htmlFor="post-storm" className="text-sm font-medium cursor-pointer">
                  Post-Storm Visits Included
                </label>
              </div>
              {formData.postStormIncluded && (
                <div className="ml-6">
                  <Label className="text-xs">Quantity per Year</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.postStormQuantity}
                    onChange={(e) => setFormData({ ...formData, postStormQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-32"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Number of Follow-Ups Included</Label>
            <Input
              type="number"
              min="0"
              value={formData.followUpsIncluded}
              onChange={(e) => setFormData({ ...formData, followUpsIncluded: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!formData.price}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Add Service
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Cancel button at bottom */}
      {step === 1 && (
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}