import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Star, ExternalLink } from 'lucide-react';

export default function ReviewsTab({ companyForm }) {
  const platforms = [
    {
      key: 'google',
      label: 'Google Reviews',
      sub: 'From your Google Business Profile',
      url: companyForm.google_business_url,
      bg: 'bg-white border',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      configLabel: 'Configure Google Profile'
    },
    {
      key: 'yelp',
      label: 'Yelp Reviews',
      sub: 'From your Yelp Business Page',
      url: companyForm.yelp_business_url,
      bg: 'bg-[#FF1A1A]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white fill-current">
          <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.686 1.459zm-5.025 3.152l4.942 1.606a1.072 1.072 0 0 1 .636 1.48 9.194 9.194 0 0 1-2.56 3.12 1.073 1.073 0 0 1-1.588-.263l-2.78-4.357c-.55-.86.253-1.923 1.35-1.586zm-3.555.617c.96.097 1.453 1.318.737 2.02l-3.68 3.615a1.072 1.072 0 0 1-1.6-.003 9.194 9.194 0 0 1-1.97-3.58 1.073 1.073 0 0 1 .845-1.387l5.668-.665zm-.18-4.596c.198.95-.81 1.73-1.63 1.176L5.19 10.55a1.072 1.072 0 0 1-.206-1.596 9.194 9.194 0 0 1 3.252-2.364 1.073 1.073 0 0 1 1.459.686l1.699 4.491zm-2.39-6.14l5.162 2.16c.9.38.9 1.68 0 2.06l-5.163 2.16a1.073 1.073 0 0 1-1.48-.637 9.194 9.194 0 0 1 0-5.107 1.073 1.073 0 0 1 1.48-.637z"/>
        </svg>
      ),
      configLabel: 'Configure Yelp Page'
    },
    {
      key: 'facebook',
      label: 'Facebook Reviews',
      sub: 'From your Facebook Business Page',
      url: companyForm.facebook_business_url,
      bg: 'bg-[#1877F2]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      configLabel: 'Configure Facebook Page'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Customer Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {platforms.map(p => (
          <div key={p.key} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${p.bg} flex items-center justify-center`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{p.label}</h3>
                  <p className="text-sm text-slate-500">{p.sub}</p>
                </div>
              </div>
              {p.url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-slate-500">Not configured</span>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center text-sm text-slate-600">
              <p className="mb-2">Connect your {p.label.split(' ')[0]} profile in Company settings to display reviews here.</p>
              {!p.url && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={createPageUrl('Settings')}>{p.configLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Review Integration Coming Soon</p>
              <p className="text-blue-700 mt-1">Live reviews require API integrations with each platform.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}