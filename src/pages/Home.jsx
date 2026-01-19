import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building, Check, ArrowRight, Users, ClipboardCheck, Calendar, 
  Route, Megaphone, Shield, TrendingUp, Briefcase, Zap, Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: ''
  });

  const handleGetStarted = () => {
    setShowRegistration(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.fullName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setRegistering(true);
    try {
      const response = await base44.functions.invoke('registerCompany', {
        companyName: formData.companyName,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      });

      if (response.data.success) {
        alert(`Registration successful! We've sent an invitation to ${formData.email}. Please check your email to complete registration and create your password.`);
        setShowRegistration(false);
        setFormData({ companyName: '', fullName: '', email: '', phone: '' });
      } else {
        alert(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again or contact support.');
    } finally {
      setRegistering(false);
    }
  };



  const features = [
    {
      icon: Users,
      title: "Client Management",
      description: "Track unlimited clients and properties with detailed profiles"
    },
    {
      icon: ClipboardCheck,
      title: "Smart Inspections",
      description: "Mobile-first inspection workflow with photo capture and checklists"
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description: "Automated scheduling and calendar sync for your team"
    },
    {
      icon: Route,
      title: "Route Optimization",
      description: "Save time with intelligent route planning for field teams"
    },
    {
      icon: Megaphone,
      title: "Marketing Tools",
      description: "Built-in campaigns and communication tools for client engagement"
    },
    {
      icon: Shield,
      title: "Team Collaboration",
      description: "Role-based access and real-time updates for your entire team"
    }
  ];

  const pricing = [
    {
      id: 'solopreneur',
      name: 'Solopreneur',
      price: 99,
      icon: Users,
      features: ['Unlimited Clients & Properties', 'Mobile Inspections', 'Client Portal', 'Auto Reports']
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 199,
      icon: TrendingUp,
      popular: true,
      features: ['Everything in Solopreneur', 'Up to 5 Team Members', 'Route Optimization', 'Advanced Reporting']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 249,
      icon: Briefcase,
      features: ['Everything in Growth', 'Up to 10 Team Members', 'Priority Support', 'Custom Branding']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      icon: Shield,
      features: ['Everything in Professional', 'Up to 50 Team Members', 'Marketing Tools', 'Dedicated Support']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/80aa6ec76_NewEstateIQLogo.png" 
                alt="Estate IQ" 
                className="h-16 w-auto object-contain" 
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-green-500 text-white hover:bg-green-600 border-0">
              Estate Management Software
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              The Complete Estate Watch Platform
            </h1>
            <p className="text-xl text-blue-50 mb-8">
              All-in-one platform for estate watch and property management companies. Streamline inspections, scheduling, client management, and field operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 shadow-lg"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-white text-white hover:bg-white hover:text-blue-700 text-lg px-8"
              >
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-4">No credit card required • Free for 14 days</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b bg-gradient-to-r from-blue-50 to-green-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">500+</div>
              <div className="text-sm text-slate-600">Properties Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">10,000+</div>
              <div className="text-sm text-slate-600">Inspections Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">98%</div>
              <div className="text-sm text-slate-600">Customer Satisfaction</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-green-500 text-green-500" />)}
              </div>
              <span className="text-sm font-medium text-slate-700">5.0 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed for modern property management teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-2 border-blue-100 hover:border-blue-400 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-2 border-blue-600 shadow-xl bg-gradient-to-br from-blue-50 to-green-50' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-slate-900">
                      ${plan.price}
                      <span className="text-lg font-normal text-slate-600">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-5 w-5 text-green-600 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={handleGetStarted}
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Join hundreds of property managers who trust Estate IQ
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-blue-100 mt-4">14 days free • No credit card required</p>
        </div>
      </section>

      {/* Registration Dialog */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Your Free Trial</DialogTitle>
            <DialogDescription>
              Create your account and get started in minutes. No credit card required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 py-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Your Company LLC"
                required
              />
            </div>

            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  14-day free trial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Cancel anytime
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistration(false)}
                className="flex-1"
                disabled={registering}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={registering}
              >
                {registering ? 'Creating Account...' : 'Start Free Trial'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/80aa6ec76_NewEstateIQLogo.png" 
                alt="Estate IQ" 
                className="h-12 w-auto object-contain" 
              />
            </div>
            <div className="flex gap-8 text-sm text-slate-600">
              <button onClick={() => base44.auth.redirectToLogin()} className="hover:text-slate-900">
                Sign In
              </button>
              <button onClick={handleGetStarted} className="hover:text-slate-900">
                Get Started
              </button>
              <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-slate-900">
                Pricing
              </button>
            </div>
            <div className="text-sm text-slate-600">
              © 2026 Estate IQ. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}