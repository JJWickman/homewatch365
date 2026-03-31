import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2, ArrowRight, Building, Users, Home,
  DollarSign, ClipboardList, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TenantOnboardingWizard({ open, onComplete, user, tenant }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState(tenant?.name || '');
  const [companyAddress, setCompanyAddress] = useState(tenant?.address || '');
  const [companyCity, setCompanyCity] = useState(tenant?.city || '');
  const [companyState, setCompanyState] = useState(tenant?.state || '');

  // Step 2: Client
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState(null);

  // Step 3: Property
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyState, setPropertyState] = useState('');
  const [propertyZip, setPropertyZip] = useState('');
  const [propertyType, setPropertyType] = useState('single_family');
  const [propertyId, setPropertyId] = useState(null);

  // Step 4: Pricing (stored in property custom_fields)
  const [basePrice, setBasePrice] = useState('');
  const [visitFrequency, setVisitFrequency] = useState('weekly');

  // Step 5: Checklist
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [checklistName, setChecklistName] = useState('');
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (step === 4) {
      loadTemplates();
    }
  }, [step]);

  const loadTemplates = async () => {
    try {
      const coreTemplates = await base44.entities.ChecklistTemplate.filter({
        is_system_template: true,
        active: true
      });
      setTemplates(coreTemplates);
      if (coreTemplates.length > 0) {
        setSelectedTemplate(coreTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleStep1Save = async () => {
    setLoading(true);
    try {
      await base44.entities.Tenant.update(tenant.id, {
        name: companyName,
        address: companyAddress,
        city: companyCity,
        state: companyState
      });
      setStep(1);
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Save = async () => {
    if (!clientFirstName || !clientLastName || !clientEmail) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const newClient = await base44.entities.Client.create({
        tenant_id: tenant.id,
        first_name: clientFirstName,
        last_name: clientLastName,
        email: clientEmail,
        phone: clientPhone,
        is_active: true
      });
      setClientId(newClient.id);
      setStep(2);
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Save = async () => {
    if (!propertyAddress || !propertyCity || !propertyState) {
      alert('Please fill in address, city, and state');
      return;
    }
    setLoading(true);
    try {
      // Geocode property
      const geocodeRes = await base44.functions.invoke('validatePropertyAddress', {
        address: propertyAddress,
        city: propertyCity,
        state: propertyState
      });

      const newProperty = await base44.entities.Property.create({
        tenant_id: tenant.id,
        client_id: clientId,
        name: propertyName || `${propertyCity} Property`,
        address: propertyAddress,
        city: propertyCity,
        state: propertyState,
        zip: propertyZip,
        property_type: propertyType,
        latitude: geocodeRes.latitude,
        longitude: geocodeRes.longitude,
        is_active: true
      });
      setPropertyId(newProperty.id);
      setStep(3);
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please check the address.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Save = async () => {
    if (!basePrice) {
      alert('Please enter a base price');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.Property.update(propertyId, {
        custom_fields: {
          base_price: parseFloat(basePrice),
          visit_frequency: visitFrequency
        }
      });
      setStep(4);
    } catch (error) {
      console.error('Error saving pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Save = async () => {
    if (!selectedTemplate || !checklistName) {
      alert('Please select a template and enter a checklist name');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.PropertyChecklist.create({
        tenant_id: tenant.id,
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        customized_sections: selectedTemplate.sections || [],
        is_active: true
      });

      // Mark onboarding as complete
      await base44.auth.updateMe({ onboarding_completed: true });
      onComplete();
    } catch (error) {
      console.error('Error creating checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Update Company Information',
      description: 'Start by setting up your company details',
      icon: Building,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div>
            <Label htmlFor="company-address">Address *</Label>
            <Input
              id="company-address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company-city">City</Label>
              <Input
                id="company-city"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="company-state">State</Label>
              <Input
                id="company-state"
                value={companyState}
                onChange={(e) => setCompanyState(e.target.value)}
                placeholder="State"
              />
            </div>
          </div>
        </div>
      ),
      onNext: handleStep1Save,
    },
    {
      title: 'Create Your First Client',
      description: 'Add a client for your properties',
      icon: Users,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="client-first">First Name *</Label>
            <Input
              id="client-first"
              value={clientFirstName}
              onChange={(e) => setClientFirstName(e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="client-last">Last Name *</Label>
            <Input
              id="client-last"
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>
          <div>
            <Label htmlFor="client-email">Email *</Label>
            <Input
              id="client-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      ),
      onNext: handleStep2Save,
    },
    {
      title: 'Create Your First Property',
      description: 'Add a property for the client',
      icon: Home,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="prop-name">Property Name (Optional)</Label>
            <Input
              id="prop-name"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g., Beach House, Mountain Cabin"
            />
          </div>
          <div>
            <Label htmlFor="prop-type">Property Type *</Label>
            <select
              id="prop-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="single_family">Single Family Home</option>
              <option value="condo">Condo/Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="estate">Estate</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <Label htmlFor="prop-address">Address *</Label>
            <Input
              id="prop-address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="prop-city">City *</Label>
              <Input
                id="prop-city"
                value={propertyCity}
                onChange={(e) => setPropertyCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="prop-state">State *</Label>
              <Input
                id="prop-state"
                value={propertyState}
                onChange={(e) => setPropertyState(e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="prop-zip">ZIP</Label>
              <Input
                id="prop-zip"
                value={propertyZip}
                onChange={(e) => setPropertyZip(e.target.value)}
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      ),
      onNext: handleStep3Save,
    },
    {
      title: 'Set Property Pricing',
      description: 'Configure pricing for this property',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="base-price">Base Price Per Visit *</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-600">$</span>
              <Input
                id="base-price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="150"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="visit-freq">Visit Frequency *</Label>
            <select
              id="visit-freq"
              value={visitFrequency}
              onChange={(e) => setVisitFrequency(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="weekly">Weekly</option>
              <option value="bi_weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> You can adjust pricing and add additional services later in the property details.
            </p>
          </div>
        </div>
      ),
      onNext: handleStep4Save,
    },
    {
      title: 'Assign & Customize Checklist',
      description: 'Select a checklist template for this property',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Select Template *</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate?.id === tmpl.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{tmpl.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="checklist-name">Checklist Name for This Property *</Label>
            <Input
              id="checklist-name"
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
              placeholder="e.g., Beach House Weekly Checklist"
            />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900">
              <strong>Tip:</strong> You can customize this checklist later by adding or removing specific items.
            </p>
          </div>
        </div>
      ),
      onNext: handleStep5Save,
    },
    {
      title: "You're All Set!",
      description: 'Onboarding complete',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Setup Complete!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your tenant is ready to manage properties and schedule visits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2 text-sm text-slate-600">
            <p>✓ Company information updated</p>
            <p>✓ First client created</p>
            <p>✓ First property created with coordinates</p>
            <p>✓ Pricing configured</p>
            <p>✓ Checklist assigned</p>
          </div>
        </div>
      ),
      onNext: null,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl">
        <DialogHeader className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <currentStep.icon className="h-6 w-6 text-white" />
            <div>
              <DialogTitle className="text-white text-lg font-semibold">
                {currentStep.title}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {currentStep.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pt-6 pb-6">
          {/* Progress indicator */}
          <div className="flex justify-between mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {currentStep.content}

          <div className="flex justify-between gap-3 mt-6">
            {step > 0 && !isLastStep && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 0 && <div />}

            {!isLastStep ? (
              <Button
                onClick={currentStep.onNext}
                disabled={loading}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Next
              </Button>
            ) : (
              <Button
                onClick={onComplete}
                className="ml-auto bg-green-600 hover:bg-green-700 w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Start Using the App
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}