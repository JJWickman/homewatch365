import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { FileText, Download, Mail, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

export default function BillingsSection({ companyId }) {
  const [statements, setStatements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('billing_month');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      const [statementsData, clientsData] = await Promise.all([
        base44.entities.MonthlyStatement.filter({ company_id: companyId }),
        base44.entities.Client.filter({ company_id: companyId })
      ]);
      setStatements(statementsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
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

  const handleSendStatement = async (statementId) => {
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
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  // Filter and sort statements
  const filteredStatements = statements
    .filter(statement => {
      // Status filter
      if (statusFilter !== 'all' && statement.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const clientName = getClientName(statement.client_id).toLowerCase();
        const statementId = statement.id.toLowerCase();
        const billingMonth = statement.billing_month.toLowerCase();
        
        return (
          clientName.includes(searchQuery.toLowerCase()) ||
          statementId.includes(searchQuery.toLowerCase()) ||
          billingMonth.includes(searchQuery.toLowerCase())
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'billing_month':
          aVal = a.billing_month;
          bVal = b.billing_month;
          break;
        case 'client':
          aVal = getClientName(a.client_id);
          bVal = getClientName(b.client_id);
          break;
        case 'total':
          aVal = a.total || 0;
          bVal = b.total || 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          All Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by client name or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billing_month">Date</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="total">Amount</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Results */}
        {filteredStatements.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery || statusFilter !== 'all' ? "No invoices found" : "No invoices yet"}
            description={searchQuery || statusFilter !== 'all' ? "Try adjusting your filters" : "Invoices will appear here once generated"}
          />
        ) : (
          <div className="space-y-2">
            {filteredStatements.map((statement) => (
              <div
                key={statement.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getClientName(statement.client_id)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-500">
                        {format(new Date(statement.billing_month + '-01'), 'MMMM yyyy')}
                      </span>
                      <span className="text-sm text-slate-400">•</span>
                      <span className="text-sm text-slate-500 font-mono">
                        #{statement.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">${statement.total.toFixed(2)}</p>
                      <Badge
                        variant="outline"
                        className={
                          statement.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          statement.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          statement.status === 'finalized' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-50 text-slate-700'
                        }
                      >
                        {statement.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
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
  );
}