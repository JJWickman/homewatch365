import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Loader2, Play } from 'lucide-react';

export default function OnboardingTest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      const userList = await base44.entities.User.filter({ email: currentUser.email });
      const freshUser = userList.length > 0 ? { ...currentUser, ...userList[0] } : currentUser;
      setUser(freshUser);

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        setCompanyMember(members[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnboardingFlag = async () => {
    setProcessing(true);
    try {
      await base44.auth.updateMe({ 
        onboarding_completed: !user.onboarding_completed 
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling flag:', error);
    } finally {
      setProcessing(false);
    }
  };

  const triggerOnboarding = () => {
    navigate(createPageUrl('CompanyOnboarding'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboarding Test Page</h1>
        <p className="text-slate-600 mt-1">Control and test the onboarding flow</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Your current user and company state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">User Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Onboarding Completed</p>
              <p className="font-medium">
                {user?.onboarding_completed ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Has Company Member</p>
              <p className="font-medium">
                {companyMember ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Company ID</p>
              <p className="font-medium">
                {companyMember?.company_id || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>Trigger different onboarding scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={toggleOnboardingFlag}
            disabled={processing}
            className="w-full"
            variant="outline"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Toggle Onboarding Flag
          </Button>

          <Button
            onClick={triggerOnboarding}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Go to Onboarding Page
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>• Dashboard checks <code className="bg-slate-200 px-1 rounded">onboarding_completed</code> flag</p>
          <p>• If <code className="bg-slate-200 px-1 rounded">false</code>, redirects to CompanyOnboarding</p>
          <p>• CompanyOnboarding shows success step if company exists</p>
          <p>• Toggle flag to test the redirect behavior</p>
        </CardContent>
      </Card>
    </div>
  );
}