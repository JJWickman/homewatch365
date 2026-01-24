import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, Users, Calendar, Loader2, Mail, FileText, Eye, Edit, Download, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingOverview({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statements, setStatements] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [searchClient, setSearchClient] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingStatement, setViewingStatement] = useState(null);
  const [editedStatement, setEditedStatement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingStatement, setSendingStatement] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadBillingData();
    }
  }, [companyId]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [clientsData, transactionsData, statementsData] = await Promise.all([
        base44.entities.Client.filter({ company_id: companyId, is_active: true }),
        base44.entities.ClientTransaction.filter({ company_id: companyId }),
        base44.entities.MonthlyStatement.filter({ company_id: companyId })
      ]);
      setClients(clientsData);
      setTransactions(transactionsData);
      setStatements(statementsData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmailDialog = (statement) => {
    const client = clients.find(c => c.id === statement.client_id);
    setSendingStatement(statement);
    setEmailAddress(client?.email || '');
    setEmailDialogOpen(true);
  };

  const handleSendInvoice = async () => {
    if (!emailAddress || !sendingStatement) return;

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendInvoiceEmail', {
        statement_id: sendingStatement.id,
        email_override: emailAddress
      });
      
      if (response.data.success) {
        toast.success(`Invoice emailed to ${emailAddress} successfully!`);
        loadBillingData();
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice: ' + error.message);
    } finally {
      setSending(false);
      setEmailDialogOpen(false);
      setSendingStatement(null);
      setEmailAddress('');
    }
  };

  const handleDownloadInvoice = async (statementId) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePDF', {
        statement_id: statementId
      });
      
      if (response.data.success) {
        window.open(response.data.pdf_url, '_blank');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice: ' + error.message);
    }
  };

  const handleViewStatement = (statement) => {
    setViewingStatement(statement);
    setEditedStatement({ ...statement });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      await base44.entities.MonthlyStatement.update(editedStatement.id, {
        line_items: editedStatement.line_items,
        subtotal: editedStatement.subtotal,
        tax_amount: editedStatement.tax_amount,
        total: editedStatement.total,
        notes: editedStatement.notes
      });
      toast.success('Invoice updated successfully!');
      setViewingStatement(null);
      loadBillingData();
    } catch (error) {
      console.error('Error updating statement:', error);
      toast.error('Failed to update invoice');
    }
  };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStartMonth = currentQuarter * 3;
  const currentYear = now.getFullYear();

  const getFilteredData = (periodType) => {
    let filteredTransactions = [];
    let filteredStatements = [];
    let periodLabel = '';

    if (periodType === 'monthly') {
      filteredTransactions = transactions.filter(t => t.billing_month === currentMonth);
      filteredStatements = statements.filter(s => s.billing_month === currentMonth);
      periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (periodType === 'qtd') {
      const quarterMonths = [];
      for (let i = 0; i <= now.getMonth() - quarterStartMonth; i++) {
        const m = quarterStartMonth + i + 1;
        quarterMonths.push(`${currentYear}-${String(m).padStart(2, '0')}`);
      }
      filteredTransactions = transactions.filter(t => quarterMonths.includes(t.billing_month));
      filteredStatements = statements.filter(s => quarterMonths.includes(s.billing_month));
      periodLabel = `Q${currentQuarter + 1} ${currentYear}`;
    } else if (periodType === 'ytd') {
      const yearMonths = [];
      for (let i = 0; i <= now.getMonth(); i++) {
        yearMonths.push(`${currentYear}-${String(i + 1).padStart(2, '0')}`);
      }
      filteredTransactions = transactions.filter(t => yearMonths.includes(t.billing_month));
      filteredStatements = statements.filter(s => yearMonths.includes(s.billing_month));
      periodLabel = `Year ${currentYear}`;
    }

    const totalRevenue = filteredStatements
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const pendingRevenue = filteredStatements
      .filter(s => ['draft', 'finalized', 'sent'].includes(s.status))
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const totalTransactions = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      transactions: filteredTransactions,
      statements: filteredStatements,
      totalRevenue,
      pendingRevenue,
      totalTransactions,
      periodLabel
    };
  };

  const data = getFilteredData(period);

  // Apply additional filters
  const filteredStatements = data.statements.filter(statement => {
    const client = clients.find(c => c.id === statement.client_id);
    const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : '';
    
    if (searchClient && !clientName.includes(searchClient.toLowerCase())) {
      return false;
    }
    if (searchMonth && !statement.billing_month.includes(searchMonth)) {
      return false;
    }
    if (filterStatus && statement.status !== filterStatus) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="monthly">Current Month</TabsTrigger>
          <TabsTrigger value="qtd">Quarter to Date</TabsTrigger>
          <TabsTrigger value="ytd">Year to Date</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="text-sm text-slate-600 font-medium">
        Showing data for: <span className="text-slate-900">{data.periodLabel}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Collected Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-amber-600">
                  ${data.pendingRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Statements</p>
                <p className="text-2xl font-bold">{data.statements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices ({data.periodLabel})</CardTitle>
          <CardDescription>Client invoices for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter by client name..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="pl-10"
              />
              {searchClient && (
                <button
                  onClick={() => setSearchClient('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                placeholder="Filter by month (YYYY-MM)..."
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
              />
              {searchMonth && (
                <button
                  onClick={() => setSearchMonth('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {filteredStatements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Client</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Month</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600">Total</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatements.map(statement => {
                    const client = clients.find(c => c.id === statement.client_id);
                    return (
                      <tr key={statement.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          {client ? `${client.first_name} ${client.last_name}` : 'Unknown'}
                        </td>
                        <td className="py-3 px-2">{statement.billing_month}</td>
                        <td className="py-3 px-2">
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
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${(statement.total || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStatement(statement)}
                              title="View & Edit Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(statement.id)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {statement.status !== 'paid' && (
                              <button
                                onClick={() => handleOpenEmailDialog(statement)}
                                title="Email to Client"
                                style={{ backgroundColor: '#000', color: '#fff', borderColor: '#000' }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-800 transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              {searchClient || searchMonth || filterStatus ? 'No invoices match your filters' : 'No invoices for this period'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Statement Dialog */}
      <Dialog open={!!viewingStatement} onOpenChange={() => setViewingStatement(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Details</span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Invoice
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {editedStatement && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-slate-600">Client</Label>
                  <p className="font-medium">
                    {(() => {
                      const client = clients.find(c => c.id === editedStatement.client_id);
                      return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
                    })()}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-600">Billing Month</Label>
                  <p className="font-medium">{editedStatement.billing_month}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Status</Label>
                  <Badge variant="outline" className="capitalize">
                    {editedStatement.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Line Items</Label>
                <div className="space-y-2">
                  {editedStatement.line_items?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      {isEditing ? (
                        <>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.description}
                              onChange={(e) => {
                                const newItems = [...editedStatement.line_items];
                                newItems[idx].description = e.target.value;
                                setEditedStatement({ ...editedStatement, line_items: newItems });
                              }}
                              placeholder="Description"
                            />
                          </div>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.amount.toFixed(2)}
                              onChange={(e) => {
                                const newItems = [...editedStatement.line_items];
                                newItems[idx].amount = parseFloat(e.target.value) || 0;
                                const newSubtotal = newItems.reduce((sum, i) => sum + i.amount, 0);
                                const newTotal = newSubtotal + (editedStatement.tax_amount || 0);
                                setEditedStatement({ 
                                  ...editedStatement, 
                                  line_items: newItems,
                                  subtotal: newSubtotal,
                                  total: newTotal
                                });
                              }}
                              className="pl-7"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            {item.type && <p className="text-xs text-slate-500 capitalize">{item.type}</p>}
                          </div>
                          <p className="font-medium">${item.amount.toFixed(2)}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${editedStatement.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-600">Tax</span>
                  {isEditing ? (
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={(editedStatement.tax_amount || 0).toFixed(2)}
                        onChange={(e) => {
                          const newTax = parseFloat(e.target.value) || 0;
                          const newTotal = editedStatement.subtotal + newTax;
                          setEditedStatement({ 
                            ...editedStatement, 
                            tax_amount: newTax,
                            total: newTotal
                          });
                        }}
                        className="pl-7 text-right"
                      />
                    </div>
                  ) : (
                    <span className="font-medium">${editedStatement.tax_amount?.toFixed(2) || '0.00'}</span>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span>${editedStatement.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedStatement.notes || ''}
                    onChange={(e) => setEditedStatement({ ...editedStatement, notes: e.target.value })}
                    placeholder="Add notes to this invoice..."
                    rows={3}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-sm text-slate-600 mt-2">{editedStatement.notes || 'No notes'}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setEditedStatement({ ...viewingStatement });
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="text-black">
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setViewingStatement(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Invoice to Client</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Send invoice to:</Label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="client@example.com"
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-2">
                Confirm or update the email address before sending
              </p>
            </div>
            
            {sendingStatement && (
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium">
                    {(() => {
                      const client = clients.find(c => c.id === sendingStatement.client_id);
                      return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Billing Month:</span>
                  <span className="font-medium">{sendingStatement.billing_month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Amount:</span>
                  <span className="font-medium">${sendingStatement.total?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvoice} 
              disabled={!emailAddress || sending}
              style={{ backgroundColor: '#000', color: '#fff' }}
              className="hover:bg-slate-800"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions ({data.periodLabel})</CardTitle>
          <CardDescription>Individual billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Description</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Client</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Type</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map(transaction => {
                    const client = clients.find(c => c.id === transaction.client_id);
                    return (
                      <tr key={transaction.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-2">{transaction.description}</td>
                        <td className="py-3 px-2">
                          {client ? `${client.first_name} ${client.last_name}` : 'Unknown'}
                        </td>
                        <td className="py-3 px-2 capitalize">{transaction.type}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="capitalize">
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${(transaction.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No transactions for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}