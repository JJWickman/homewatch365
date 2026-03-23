import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Send, Sparkles } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function ApproveFounder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmailWithAI = async () => {
    if (!aiPrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email prompt' });
      return;
    }

    setGeneratingEmail(true);
    setMessage(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert email composer. Write a professional email based on this request:\n\n${aiPrompt}\n\nRespond with a JSON object containing:\n{\n  "subject": "email subject line",\n  "body": "email body text"\n}`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          },
          required: ["subject", "body"]
        }
      });

      const emailData = response.data;
      if (emailData?.subject && emailData?.body) {
        setSubject(emailData.subject);
        setBody(emailData.body);
        setMessage({ type: 'success', text: 'Email generated successfully' });
      } else {
        console.error('Invalid response:', emailData);
        setMessage({ type: 'error', text: 'Failed to generate email — check console' });
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessage({ type: 'error', text: error.message || 'Error generating email' });
    } finally {
      setGeneratingEmail(false);
    }
  };

  const sendEmail = async () => {
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSendingEmail(true);
    setMessage(null);
    try {
      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject,
        body,
        from_name: 'Estate Watch 365'
      });
      setMessage({ type: 'success', text: 'Email sent successfully' });
      setRecipient('');
      setSubject('');
      setBody('');
      setAiPrompt('');
    } catch (error) {
      console.error('Send error:', error);
      setMessage({ type: 'error', text: error.message || 'Error sending email' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || user.email !== 'jasonwi@live.com') {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Access Denied" />
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold">Unauthorized</p>
          <p className="text-slate-600 text-sm">This page is only for the app administrator.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader 
        title="Email Composer" 
        subtitle="AI-powered email drafting with SendGrid"
      />

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <AlertCircle className={`h-4 w-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* AI Prompt Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Email Generator
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Request
              </label>
              <Textarea
                placeholder="Describe what you want the email to say (e.g., 'Write a welcome email for a new founder about our platform')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="h-24"
              />
            </div>
            <Button
              onClick={generateEmailWithAI}
              disabled={generatingEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generatingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Email Composer Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Recipient Email *
              </label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subject *
              </label>
              <Input
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Body *
              </label>
              <Textarea
                placeholder="Email content"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-40"
              />
            </div>
            <div className="pt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>From: noreply@estatewatch365.app</span>
            </div>
          </div>
        </Card>

        {/* Send Button */}
        <Button
          onClick={sendEmail}
          disabled={sendingEmail || !recipient || !subject || !body}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10"
        >
          {sendingEmail ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}