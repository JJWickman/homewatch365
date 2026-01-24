import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText, Send, Mail } from 'lucide-react';

export default function MonthlyStatementDialog({ open, onOpenChange, clientId, billingMonth, onStatementUpdated }) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [newItem, setNewItem] = useState({ description: '', amount: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && clientId && billingMonth) {
      loadStatement();
    }
  }, [open, clientId, billingMonth]);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const client = await base44.entities.Client.filter({ id: clientId });
      if (client.length === 0) return;

      const currentClient = client[0];
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      const companyId = members[0]?.company_id;

      // Check for existing invoice
      const statements = await base44.entities.MonthlyStatement.filter({ 
        client_id: clientId, 
        billing_month: billingMonth 
      });

      if (statements.length > 0) {
        setInvoice(statements[0]);
        setLineItems(statements[0].line_items || []);
      } else {
        // Generate draft invoice
        const items = await generateLineItems(currentClient, companyId);
        setLineItems(items);
        
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const newInvoice = await base44.entities.MonthlyStatement.create({
          company_id: companyId,
          client_id: clientId,
          billing_month: billingMonth,
          status: 'draft',
          line_items: items,
          subtotal,
          tax_amount: 0,
          total: subtotal
        });
        setInvoice(newInvoice);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLineItems = async (client, companyId) => {
    const items = [];

    // Add subscription service
    if (client.service_subscription_id) {
      const services = await base44.entities.ProductService.filter({ 
        id: client.service_subscription_id 
      });
      if (services.length > 0) {
        const service = services[0];
        items.push({
          description: service.name,
          amount: service.price,
          type: 'service',
          product_service_id: service.id
        });
      }
    }

    // Add additional products
    if (client.additional_products && client.additional_products.length > 0) {
      const products = await base44.entities.ProductService.filter({ 
        company_id: companyId 
      });
      
      client.additional_products.forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
          items.push({
            description: product.name,
            amount: product.price,
            type: 'product',
            product_service_id: product.id
          });
        }
      });
    }

    // Add custom transactions for this month
    const transactions = await base44.entities.ClientTransaction.filter({ 
      client_id: client.id,
      billing_month: billingMonth
    });
    
    transactions.forEach(t => {
      items.push({
        description: t.description,
        amount: t.amount,
        type: 'custom'
      });
    });

    return items;
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.amount) return;
    
    const updatedItems = [...lineItems, {
      description: newItem.description,
      amount: parseFloat(newItem.amount),
      type: 'custom'
    }];
    
    setLineItems(updatedItems);
    setNewItem({ description: '', amount: '' });
    updateStatement(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
    updateStatement(updatedItems);
  };

  const updateStatement = async (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    await base44.entities.MonthlyStatement.update(invoice.id, {
      line_items: items,
      subtotal,
      total: subtotal
    });

    if (onStatementUpdated) onStatementUpdated();
  };

  const handleFinalize = async () => {
    await base44.entities.MonthlyStatement.update(invoice.id, {
      status: 'finalized',
      finalized_at: new Date().toISOString()
    });
    
    if (onStatementUpdated) onStatementUpdated();
    onOpenChange(false);
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await base44.functions.invoke('sendMonthlyStatement', {
        statement_id: invoice.id,
        client_id: clientId
      });

      if (response.data.success) {
        await base44.entities.MonthlyStatement.update(invoice.id, {
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        
        alert('Invoice sent successfully!');
        if (onStatementUpdated) onStatementUpdated();
        loadStatement(); // Reload to show updated status
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Invoice - {new Date(billingMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </DialogTitle>
          <DialogDescription>
            Review and edit invoice before finalizing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.description}</p>
                    <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${item.amount.toFixed(2)}</span>
                    {invoice?.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {lineItems.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No items yet</p>
              )}

              {/* Add New Item (only if draft) */}
              {invoice?.status === 'draft' && (
                <div className="border-t pt-3 mt-3">
                  <Label className="text-sm font-medium mb-2 block">Add Custom Item</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={newItem.amount}
                      onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-32"
                    />
                    <Button onClick={handleAddItem} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-blue-600">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {invoice?.status === 'draft' && (
              <Button onClick={handleFinalize}>
                <Send className="h-4 w-4 mr-2" />
                Finalize Invoice
              </Button>
            )}
            {(invoice?.status === 'finalized' || invoice?.status === 'sent') && (
              <Button onClick={handleSendEmail} disabled={sending}>
                <Mail className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : invoice?.status === 'sent' ? 'Resend Email' : 'Send Email'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}