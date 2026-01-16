import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, ChevronDown } from 'lucide-react';

export default function EnhancedDataTable({ 
  columns, 
  data, 
  loading, 
  onRowClick,
  onSelectionChange,
  emptyMessage = 'No data found'
}) {
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.accessor]: col.visible !== false }), {})
  );
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [columnFilters, setColumnFilters] = useState({});

  const visibleColumnsArray = useMemo(() => 
    columns.filter(col => visibleColumns[col.accessor]),
    [columns, visibleColumns]
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(row => {
      return Object.entries(columnFilters).every(([colAccessor, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = row[colAccessor];
        if (!cellValue) return false;
        
        const cellStr = String(cellValue).toLowerCase();
        const filterStr = String(filterValue).toLowerCase();
        return cellStr.includes(filterStr);
      });
    });
  }, [data, columnFilters]);

  const handleColumnVisibilityChange = (accessor) => {
    setVisibleColumns(prev => ({
      ...prev,
      [accessor]: !prev[accessor]
    }));
  };

  const handleSelectRow = (rowId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(filteredData.map(row => row.id));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  const handleColumnFilter = (accessor, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [accessor]: value || undefined
    }));
  };

  if (loading) {
    return (
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              {visibleColumnsArray.map((col) => (
                <TableHead key={col.accessor} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                {visibleColumnsArray.map((_, j) => (
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

  if (!data || filteredData.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Controls */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <div className="text-sm text-slate-600">
              {selectedRows.size} selected
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Columns
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.accessor}
                checked={visibleColumns[col.accessor]}
                onCheckedChange={() => handleColumnVisibilityChange(col.accessor)}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table with Filters */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  indeterminate={selectedRows.size > 0 && selectedRows.size < filteredData.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumnsArray.map((col) => (
                <TableHead 
                  key={col.accessor} 
                  className={`font-semibold ${col.className || ''}`}
                >
                  {col.filterable ? (
                    <div className="flex flex-col gap-2">
                      <div>{col.header}</div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[col.accessor] || ''}
                        onChange={(e) => handleColumnFilter(col.accessor, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border rounded bg-white text-slate-900 placeholder-slate-400"
                      />
                    </div>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow 
                key={row.id} 
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''} ${
                  selectedRows.has(row.id) ? 'bg-blue-50' : ''
                }`}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => handleSelectRow(row.id)}
                  />
                </TableCell>
                {visibleColumnsArray.map((col) => (
                  <TableCell 
                    key={col.accessor} 
                    className={col.cellClassName}
                    onClick={() => !selectedRows.has(row.id) && onRowClick?.(row)}
                  >
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}