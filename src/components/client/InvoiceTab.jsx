import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Send, Edit, Loader2, FileText, DollarSign, Mail, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import EmptyState from '@/components/shared/EmptyState';

export default function InvoiceTab({ clientId, client }) {
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingStatement, setEditingStatement] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      const [statementsData, transactionsData] = await Promise.all([
        base44.entities.MonthlyStatement.filter({ client_id: clientId }, '-billing_month'),
        base44.entities.ClientTransaction.filter({ client_id: clientId }, '-transaction_date', 50)
      ]);
      setStatements(statementsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndSend = async () => {
    if (!client.email) {
      toast.error('Client email is required');
      return;
    }

    setGenerating(true);
    try {
      // Get current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Check if statement already exists
      let statement = statements.find(s => s.billing_month === currentMonth);
      
      if (!statement) {
        // Get all transactions for the current month
        const monthTransactions = transactions.filter(t => t.billing_month === currentMonth);
        
        if (monthTransactions.length === 0) {
          toast.error('No transactions found for the current month');
          return;
        }

        // Calculate totals
        const subtotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const taxAmount = 0;
        const total = subtotal + taxAmount;

        // Create line items from transactions
        const lineItems = monthTransactions.map(t => ({
          description: t.description,
          amount: t.amount,
          type: t.type
        }));

        // Create statement
        statement = await base44.entities.MonthlyStatement.create({
          company_id: client.company_id,
          client_id: clientId,
          billing_month: currentMonth,
          status: 'draft',
          line_items: lineItems,
          subtotal,
          tax_amount: taxAmount,
          total
        });
      }

      // Send the invoice
      const response = await base44.functions.invoke('sendInvoiceEmail', {
        statement_id: statement.id
      });

      if (response.data.success) {
        toast.success('Invoice generated and sent successfully!');
        loadData();
      } else {
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendStatement = async (statementId) => {
    if (!client.email) {
      toast.error('Client email is required');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendInvoiceEmail', {
        statement_id: statementId
      });

      if (response.data.success) {
        toast.success('Invoice sent successfully!');
        await base44.entities.MonthlyStatement.update(statementId, {
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        loadData();
      } else {
        toast.error(response.data.message || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const handleEditStatement = (statement) => {
    setEditingStatement({ ...statement });
    setShowEditDialog(true);
  };

  const handleSaveStatement = async () => {
    try {
      const lineItems = editingStatement.line_items || [];
      const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const taxAmount = parseFloat(editingStatement.tax_amount) || 0;
      const total = subtotal + taxAmount;

      await base44.entities.MonthlyStatement.update(editingStatement.id, {
        line_items: lineItems,
        subtotal,
        tax_amount: taxAmount,
        total,
        notes: editingStatement.notes
      });

      toast.success('Invoice updated successfully');
      setShowEditDialog(false);
      setEditingStatement(null);
      loadData();
    } catch (error) {
      console.error('Error updating statement:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleAddLineItem = () => {
    const newItem = { description: '', amount: 0 };
    setEditingStatement({
      ...editingStatement,
      line_items: [...(editingStatement.line_items || []), newItem]
    });
  };

  const handleUpdateLineItem = (index, field, value) => {
    const updatedItems = [...editingStatement.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditingStatement({ ...editingStatement, line_items: updatedItems });
  };

  const handleRemoveLineItem = (index) => {
    const updatedItems = editingStatement.line_items.filter((_, i) => i !== index);
    setEditingStatement({ ...editingStatement, line_items: updatedItems });
  };

  const handleDownloadStatement = async (statementId) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePDF', {
        statement_id: statementId
      });

      if (response.data.success) {
        window.open(response.data.pdf_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
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

  // Get current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentStatement = statements.find(s => s.billing_month === currentMonth);
  const currentMonthTransactions = transactions.filter(t => t.billing_month === currentMonth);

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {editingStatement && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Line Items</p>
                <div className="space-y-2">
                  {editingStatement.line_items?.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleUpdateLineItem(index, 'amount', parseFloat(e.target.value))}
                        placeholder="Amount"
                        step="0.01"
                        className="w-32 px-3 py-2 border rounded-md text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Tax Amount</label>
                <input
                  type="number"
                  value={editingStatement.tax_amount || 0}
                  onChange={(e) => setEditingStatement({ ...editingStatement, tax_amount: parseFloat(e.target.value) })}
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={editingStatement.notes || ''}
                  onChange={(e) => setEditingStatement({ ...editingStatement, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${(editingStatement.line_items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Tax:</span>
                  <span>${(parseFloat(editingStatement.tax_amount) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>${((editingStatement.line_items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0) + (parseFloat(editingStatement.tax_amount) || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatement} className="bg-slate-900 hover:bg-slate-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <div className="space-y-4">
      {/* Generate & Send Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              {currentStatement 
                ? 'An invoice has already been generated for this month.'
                : `Generate invoice for ${format(new Date(currentMonth + '-01'), 'MMMM yyyy')} with all transactions and send to client.`
              }
            </p>
            {currentMonthTransactions.length > 0 && (
              <p className="text-xs text-blue-700">
                {currentMonthTransactions.length} transaction(s) this month • Total: ${currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleGenerateAndSend}
            disabled={generating || !client.email || currentMonthTransactions.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {currentStatement ? 'Resend Current Invoice' : 'Generate & Send Invoice'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Generate the first invoice for this client"
            />
          ) : (
            <div className="space-y-2">
              {statements.map((statement) => (
                <div 
                  key={statement.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {format(new Date(statement.billing_month + '-01'), 'MMMM yyyy')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={
                            statement.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                            statement.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-700'
                          }
                        >
                          {statement.status}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          ${statement.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStatement(statement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadStatement(statement.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {statement.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendStatement(statement.id)}
                        disabled={sending}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Month Transactions */}
      {currentMonthTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentMonthTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-xs text-slate-500 capitalize">{transaction.type}</p>
                  </div>
                  <p className="font-semibold text-slate-900">${transaction.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">${currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}