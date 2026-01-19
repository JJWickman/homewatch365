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
import { base44 } from '@/api/base44Client';

export default function Landing() {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        // User is logged in, redirect to dashboard
        const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
        if (members.length > 0) {
          navigate(createPageUrl('Dashboard'));
        } else {
          navigate(createPageUrl('CompanyOnboarding'));
        }
      }
    } catch {
      // Not logged in, show landing page
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('CompanyOnboarding'));
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

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
              <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Estate Watch</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="bg-slate-900 hover:bg-slate-800">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-amber-500 text-white hover:bg-amber-600">
              Property Management Made Simple
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Manage Properties Like a Pro
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              All-in-one platform for property managers and estate concierge services. Inspections, scheduling, client management, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-4">No credit card required • Free for 14 days</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">500+</div>
              <div className="text-sm text-slate-600">Properties Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">10,000+</div>
              <div className="text-sm text-slate-600">Inspections Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">98%</div>
              <div className="text-sm text-slate-600">Customer Satisfaction</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
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
              <Card key={idx} className="border-2 hover:border-slate-900 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-slate-900" />
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
                  className={`relative ${plan.popular ? 'border-2 border-slate-900 shadow-xl' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-slate-900 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-slate-900" />
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
                      className={`w-full ${plan.popular ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
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
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join hundreds of property managers who trust Estate Watch
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-slate-400 mt-4">14 days free • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Estate Watch</span>
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
              © 2026 Estate Watch. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}