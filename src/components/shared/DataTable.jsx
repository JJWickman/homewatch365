import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  onRowClick,
  emptyMessage = 'No data found'
}) {
  if (loading) {
    return (
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((col, i) => (
                <TableHead key={i} className={`font-semibold ${col.className || ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow 
                key={row.id || i} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className={col.cellClassName}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {data.map((row, i) => (
          <div 
            key={row.id || i}
            onClick={() => onRowClick && onRowClick(row)}
            className={`border rounded-lg bg-white p-3 space-y-1.5 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
          >
            {columns.map((col, j) => (
              <div key={j} className={`flex items-center justify-between gap-2 ${col.cellClassName}`}>
                <span className="text-xs font-medium text-slate-500 truncate">{col.header}:</span>
                <span className="text-xs text-slate-900 text-right flex-1">
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}