import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Mail, MessageSquare, Plus, Edit2, Trash2, Send, Eye, MoreVertical,
  Calendar, Users, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';

export default function Marketing() {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Template dialog
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    type: 'email',
    content: ''
  });

  // Campaign dialog
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    type: 'email',
    template_id: '',
    recipient_type: 'all_clients',
    recipient_ids: [],
    scheduled_date: '',
    notes: ''
  });

  const [sendingCampaign, setSendingCampaign] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);

        const [templatesData, campaignsData, logsData, clientsData] = await Promise.all([
          base44.entities.CommunicationTemplate.filter({ company_id: cId, is_active: true }),
          base44.entities.Campaign.filter({ company_id: cId }, '-created_date'),
          base44.entities.CommunicationLog.filter({ company_id: cId }, '-created_date', 50),
          base44.entities.Client.filter({ company_id: cId, is_active: true })
        ]);

        setTemplates(templatesData);
        setCampaigns(campaignsData);
        setLogs(logsData);
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!companyId || !templateForm.name || !templateForm.content) return;

    const data = {
      company_id: companyId,
      name: templateForm.name,
      subject: templateForm.subject,
      type: templateForm.type,
      content: templateForm.content
    };

    if (editingTemplate) {
      await base44.entities.CommunicationTemplate.update(editingTemplate.id, data);
    } else {
      await base44.entities.CommunicationTemplate.create(data);
    }

    setShowTemplateDialog(false);
    setTemplateForm({ name: '', subject: '', type: 'email', content: '' });
    setEditingTemplate(null);
    loadData();
  };

  const handleDeleteTemplate = async (id) => {
    await base44.entities.CommunicationTemplate.update(id, { is_active: false });
    loadData();
  };

  const handleSaveCampaign = async () => {
    if (!companyId || !campaignForm.name || !campaignForm.template_id) return;

    const template = templates.find(t => t.id === campaignForm.template_id);
    const data = {
      company_id: companyId,
      name: campaignForm.name,
      description: campaignForm.description,
      type: campaignForm.type,
      template_id: campaignForm.template_id,
      template_name: template?.name,
      recipient_type: campaignForm.recipient_type,
      recipient_ids: campaignForm.recipient_ids,
      property_type_filter: campaignForm.property_type_filter,
      scheduled_date: campaignForm.scheduled_date,
      notes: campaignForm.notes,
      created_by: user?.email
    };

    if (editingCampaign) {
      await base44.entities.Campaign.update(editingCampaign.id, data);
    } else {
      await base44.entities.Campaign.create(data);
    }

    setShowCampaignDialog(false);
    setCampaignForm({
      name: '',
      description: '',
      type: 'email',
      template_id: '',
      recipient_type: 'all_clients',
      recipient_ids: [],
      scheduled_date: '',
      notes: ''
    });
    setEditingCampaign(null);
    loadData();
  };

  const handleSendCampaign = async (campaignId) => {
    setSendingCampaign(true);
    try {
      await base44.functions.invoke('sendCampaign', { campaign_id: campaignId });
      loadData();
    } catch (error) {
      console.error('Error sending campaign:', error);
    } finally {
      setSendingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    await base44.entities.Campaign.update(id, { status: 'cancelled' });
    loadData();
  };

  const getTemplate = (id) => templates.find(t => t.id === id);
  const getClient = (id) => clients.find(c => c.id === id);

  return (
    <div>
      <PageHeader
        title="Marketing & Communications"
        subtitle="Create campaigns, manage templates, and track communications"
      />

      <Tabs defaultValue="templates" className="mb-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', subject: '', type: 'email', content: '' });
                setShowTemplateDialog(true);
              }}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card>
              <EmptyState
                icon={Mail}
                title="No templates yet"
                description="Create your first communication template to start campaigns."
                action={() => setShowTemplateDialog(true)}
                actionLabel="Create Template"
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                        </div>
                        {template.subject && (
                          <p className="text-sm text-slate-600 mb-2">Subject: {template.subject}</p>
                        )}
                        <p className="text-sm text-slate-500 line-clamp-2">{template.content}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingTemplate(template);
                              setTemplateForm({
                                name: template.name,
                                subject: template.subject || '',
                                type: template.type,
                                content: template.content
                              });
                              setShowTemplateDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                setEditingCampaign(null);
                setCampaignForm({
                  name: '',
                  description: '',
                  type: 'email',
                  template_id: '',
                  recipient_type: 'all_clients',
                  recipient_ids: [],
                  scheduled_date: '',
                  notes: ''
                });
                setShowCampaignDialog(true);
              }}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <EmptyState
                icon={BarChart3}
                title="No campaigns yet"
                description="Create your first campaign to reach your clients."
                action={() => setShowCampaignDialog(true)}
                actionLabel="Create Campaign"
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <StatusBadge status={campaign.status} />
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{campaign.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {campaign.template_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campaign.recipient_type.replace('_', ' ')}
                          </span>
                          {campaign.sent_count > 0 && (
                            <span className="flex items-center gap-1">
                              ✓ {campaign.sent_count} sent
                            </span>
                          )}
                          {campaign.failed_count > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
                              ✗ {campaign.failed_count} failed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendCampaign(campaign.id)}
                              disabled={sendingCampaign}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingCampaign(campaign);
                                    setCampaignForm({
                                      name: campaign.name,
                                      description: campaign.description,
                                      type: campaign.type,
                                      template_id: campaign.template_id,
                                      recipient_type: campaign.recipient_type,
                                      recipient_ids: campaign.recipient_ids || [],
                                      scheduled_date: campaign.scheduled_date || '',
                                      notes: campaign.notes || ''
                                    });
                                    setShowCampaignDialog(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>All sent emails and SMS messages</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No communications yet"
                  description="Communications will appear here as campaigns are sent."
                />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.map((log) => {
                    const client = getClient(log.client_id);
                    return (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {log.type === 'email' ? (
                                <Mail className="h-4 w-4 text-blue-600" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-green-600" />
                              )}
                              <p className="font-medium text-sm">
                                {client?.first_name} {client?.last_name}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={log.status === 'sent' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}
                              >
                                {log.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 truncate">
                              {log.type === 'email' ? log.client_email : log.client_phone}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {log.sent_at ? new Date(log.sent_at).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable communication template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Weekly Inspection Reminder"
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={templateForm.type}
                onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templateForm.type === 'email' && (
              <div>
                <Label>Email Subject *</Label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Inspection Update for {{property_name}}"
                />
              </div>
            )}

            <div>
              <Label>Message Content *</Label>
              <Textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Use {{client_name}}, {{property_name}}, {{company_name}} as variables"
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-2">
                Available variables: {`{client_name}, {property_name}, {company_name}`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!templateForm.name || !templateForm.content}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
            </DialogTitle>
            <DialogDescription>
              Create and configure a campaign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Q1 Property Updates"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Campaign details"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Email & SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Template *</Label>
                <Select
                  value={campaignForm.template_id}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Recipients *</Label>
              <Select
                value={campaignForm.recipient_type}
                onValueChange={(value) => setCampaignForm(prev => ({ ...prev, recipient_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_clients">All Clients</SelectItem>
                  <SelectItem value="selected_clients">Selected Clients</SelectItem>
                  <SelectItem value="by_property_type">By Property Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={campaignForm.notes}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes about this campaign"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCampaign}
              disabled={!campaignForm.name || !campaignForm.template_id}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {editingCampaign ? 'Update' : 'Create'} Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}