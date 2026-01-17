import React from 'react';
import { List, Grid2X2, Grid3X3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ViewToggle({ view, onViewChange, isMobile }) {
  if (isMobile) {
    return (
      <Select value={view} onValueChange={onViewChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="list">List View</SelectItem>
          <SelectItem value="large-tiles">Large Tiles</SelectItem>
          <SelectItem value="small-tiles">Small Tiles</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex gap-1 bg-black rounded-lg p-1">
      <Button
        size="sm"
        variant={view === 'list' ? 'default' : 'ghost'}
        onClick={() => onViewChange('list')}
        className={`gap-2 ${view === 'list' ? 'text-white bg-slate-900' : 'text-white hover:text-white hover:bg-slate-800'}`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        size="sm"
        variant={view === 'large-tiles' ? 'default' : 'ghost'}
        onClick={() => onViewChange('large-tiles')}
        className={`gap-2 ${view === 'large-tiles' ? 'text-white bg-slate-900' : 'text-white hover:text-white hover:bg-slate-800'}`}
      >
        <Grid2X2 className="h-4 w-4" />
        <span className="hidden sm:inline">Large</span>
      </Button>
      <Button
        size="sm"
        variant={view === 'small-tiles' ? 'default' : 'ghost'}
        onClick={() => onViewChange('small-tiles')}
        className={`gap-2 ${view === 'small-tiles' ? 'text-white bg-slate-900' : 'text-white hover:text-white hover:bg-slate-800'}`}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline">Small</span>
      </Button>
    </div>
  );
}