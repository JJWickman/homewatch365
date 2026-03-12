import React from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2, Download, CreditCard, DollarSign, 
  FileText, Calendar, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PortalBillingTab({ 
  client, serviceSubscription, additionalProducts,
  allStatements, onDownloadInvoice, onPayInvoice 
}) {
  const totalMonthly = (serviceSubscription?.price || 0) + 
    (additionalProducts || []).reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Service Plan */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Your Service Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceSubscription ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{serviceSubscription.name}</p>
                  {serviceSubscription.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{serviceSubscription.description}</p>
                  )}
                  {serviceSubscription.inspection_frequency && (
                    <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200 text-xs capitalize">
                      {serviceSubscription.inspection_frequency.replace('_', '-')} visits
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">${(serviceSubscription.price || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">/month</p>
                </div>
              </div>

              {(additionalProducts || []).length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-slate-600">Add-on Services</p>
                  {additionalProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{p.name}</span>
                      <span className="font-medium">${(p.price || 0).toFixed(2)}/mo</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">Total Monthly</p>
                  <p className="text-xs text-slate-500 capitalize">Billed {client.billing_frequency || 'monthly'}</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">${totalMonthly.toFixed(2)}</p>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm py-2">No active subscription on file. Contact your property manager.</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods / How to Pay */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-slate-500 text-xs mb-0.5">Billing Status</p>
              <p className={`font-semibold capitalize ${
                client.billing_status === 'active' ? 'text-emerald-600' :
                client.billing_status === 'past_due' ? 'text-red-600' : 'text-slate-700'
              }`}>{client.billing_status || 'Active'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-slate-500 text-xs mb-0.5">Billing Frequency</p>
              <p className="font-semibold capitalize text-slate-700">{client.billing_frequency || 'Monthly'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            To update your payment method or billing details, please contact your property manager.
          </p>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!allStatements || allStatements.length === 0) ? (
            <div className="text-center py-8 text-slate-400">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No invoices yet</p>
              <p className="text-xs mt-1">Invoices appear here once generated by your manager</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allStatements.map(stmt => (
                <div key={stmt.id}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">
                        {format(new Date(stmt.billing_month + '-01'), 'MMMM yyyy')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        stmt.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        stmt.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {stmt.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                        <span className="capitalize">{stmt.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Total: <span className="font-semibold text-slate-700">${(stmt.total || 0).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onDownloadInvoice(stmt.id)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {stmt.status !== 'paid' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-3"
                        onClick={() => onPayInvoice(stmt)}>
                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}