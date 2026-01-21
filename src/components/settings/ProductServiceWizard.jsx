import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Wrench, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ProductServiceWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null); // 'product' or 'service'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
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
        ...formData,
        price: parseFloat(formData.price),
        is_active: true
      });
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setType(null);
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

          <div className="grid grid-cols-2 gap-4">
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

      {/* Step 2: Service (Coming soon) */}
      {step === 2 && type === 'service' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Wrench className="h-4 w-4" />
            <span>Adding a Service</span>
          </div>

          <div className="text-center py-8 text-slate-500">
            <p>Service wizard coming soon...</p>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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