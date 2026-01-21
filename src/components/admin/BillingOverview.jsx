import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';

export default function BillingOverview({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statements, setStatements] = useState([]);
  const [period, setPeriod] = useState('monthly');

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
          <CardTitle className="text-base">Statements ({data.periodLabel})</CardTitle>
          <CardDescription>Client billing statements for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {data.statements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Client</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Month</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.statements.map(statement => {
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No statements for this period</p>
          )}
        </CardContent>
      </Card>

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