import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Send, Edit, Loader2, FileText, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import EmptyState from '@/components/shared/EmptyState';

export default function InvoiceTab({ clientId, client }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [clientId]);

  const loadInvoices = async () => {
    try {
      const data = await base44.entities.Invoice.filter({ client_id: clientId }, '-created_date', 10);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoice) => {
    if (!client.email) {
      toast.error('Client email is required to send invoice');
      return;
    }

    setSending(true);
    try {
      const result = await base44.functions.invoke('sendExternalEmail', {
        to: client.email,
        subject: `Invoice #${invoice.invoice_number} - ${invoice.description || 'Your Invoice'}`,
        body: `
Hello ${client.first_name} ${client.last_name},

Please find your invoice details below:

Invoice Number: #${invoice.invoice_number}
Date: ${format(new Date(invoice.invoice_date), 'MMMM d, yyyy')}
${invoice.due_date ? `Due Date: ${format(new Date(invoice.due_date), 'MMMM d, yyyy')}` : ''}

Description: ${invoice.description || 'Service Invoice'}
Amount: $${invoice.amount ? invoice.amount.toFixed(2) : '0.00'}
Status: ${invoice.status.toUpperCase()}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!

Best regards,
${client.company_id ? 'Your Property Management Team' : 'EstateWatch365'}
        `,
        from_name: 'EstateWatch365'
      });

      if (result.data.success) {
        toast.success('Invoice sent successfully');
        // Update invoice status to sent
        await base44.entities.Invoice.update(invoice.id, { 
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        loadInvoices();
      } else {
        toast.error(result.data.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice({ ...invoice });
    setEditMode(true);
  };

  const handleSaveInvoice = async () => {
    try {
      await base44.entities.Invoice.update(editingInvoice.id, {
        description: editingInvoice.description,
        amount: parseFloat(editingInvoice.amount),
        due_date: editingInvoice.due_date,
        notes: editingInvoice.notes,
        status: editingInvoice.status
      });
      setEditMode(false);
      setEditingInvoice(null);
      toast.success('Invoice updated');
      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={FileText}
            title="No invoices"
            description="No invoices have been created for this client yet"
          />
        </CardContent>
      </Card>
    );
  }

  const currentInvoice = invoices[0]; // Most recent invoice

  if (editMode && editingInvoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Invoice #{editingInvoice.invoice_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editingInvoice.description || ''}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={editingInvoice.amount || ''}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={editingInvoice.due_date ? editingInvoice.due_date.split('T')[0] : ''}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, due_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={editingInvoice.status}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={editingInvoice.notes || ''}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setEditMode(false); setEditingInvoice(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveInvoice} className="bg-slate-900 hover:bg-slate-800">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Invoice */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Current Invoice</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEditInvoice(currentInvoice)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSendInvoice(currentInvoice)}
              disabled={sending || !client.email}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Invoice Number</p>
              <p className="font-medium">#{currentInvoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Date</p>
              <p className="font-medium">
                {currentInvoice.invoice_date ? format(new Date(currentInvoice.invoice_date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Due Date</p>
              <p className="font-medium">
                {currentInvoice.due_date ? format(new Date(currentInvoice.due_date), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                currentInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                currentInvoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                currentInvoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {currentInvoice.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-slate-500 mb-2">Description</p>
            <p className="font-medium">{currentInvoice.description || 'No description'}</p>
          </div>

          {currentInvoice.notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-slate-500 mb-2">Notes</p>
              <p className="text-slate-600 whitespace-pre-wrap">{currentInvoice.notes}</p>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between items-center">
            <p className="text-lg font-semibold text-slate-500">Total Amount</p>
            <p className="text-3xl font-bold text-slate-900">${currentInvoice.amount ? currentInvoice.amount.toFixed(2) : '0.00'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      {invoices.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.slice(1).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium">#{invoice.invoice_number}</p>
                      <p className="text-sm text-slate-500">
                        {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                   <p className="font-semibold">${invoice.amount ? invoice.amount.toFixed(2) : '0.00'}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}