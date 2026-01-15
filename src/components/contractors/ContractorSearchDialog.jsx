import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Star, Loader2, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function ContractorSearchDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  properties = [],
  companyId
}) {
  const [searchType, setSearchType] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [radius, setRadius] = useState('25');
  const [minRating, setMinRating] = useState('3.5');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState(new Set());

  const handleSearch = async () => {
    if (!searchType || !selectedProperty) {
      return;
    }

    const property = properties.find(p => p.id === selectedProperty);
    if (!property) {
      return;
    }

    setSearching(true);
    try {
      const { data } = await base44.functions.invoke('searchContractors', {
        service_type: searchType,
        address: `${property.address}, ${property.city}, ${property.state}`,
        radius_miles: parseInt(radius),
        min_rating: parseFloat(minRating),
        company_id: companyId
      });

      setResults(data.contractors || []);
    } catch (error) {
      console.error('Error searching contractors:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddSelected = () => {
    selectedContractors.forEach(index => {
      const contractor = results[index];
      onSelect({
        business_name: contractor.business_name,
        contact_name: '',
        contractor_type: searchType,
        email: '',
        phone: contractor.phone || '',
        secondary_phone: '',
        address: contractor.address || '',
        city: contractor.city || '',
        state: contractor.state || '',
        zip: contractor.zip || '',
        license_number: '',
        insurance_info: '',
        hourly_rate: '',
        notes: `Found via ${contractor.source}. Rating: ${contractor.rating}/5 (${contractor.review_count} reviews). Source: ${contractor.source_url}`,
        is_active: true,
        source: contractor.source,
        source_url: contractor.source_url
      });
    });
    
    setSelectedContractors(new Set());
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search for Contractors</DialogTitle>
          <DialogDescription>
            Search Google Business, Facebook, and Yelp for contractors near a property
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4">
            {/* Search Form */}
            <div className="grid gap-4 border-b pb-4">
              <div>
                <Label>Service Type Needed *</Label>
                <Input
                  placeholder="e.g., Electrician, HVAC, Plumber, Roofer"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                />
              </div>

              <div>
                <Label>Property Location *</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name || prop.address} - {prop.city}, {prop.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Search Radius (miles)</Label>
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Minimum Rating</Label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="3.5">3.5+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={!searchType || !selectedProperty || searching}
                className="bg-slate-900 hover:bg-slate-800 w-full"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Contractors
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results */}
            <div className="flex items-center justify-between">
              <p className="font-medium">Found {results.length} contractors</p>
              <Button 
                variant="outline"
                onClick={() => setResults([])}
                size="sm"
              >
                Back to Search
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((contractor, index) => (
                <Card 
                  key={index}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedContractors.has(index) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-slate-400'
                  }`}
                  onClick={() => {
                    const newSelected = new Set(selectedContractors);
                    if (newSelected.has(index)) {
                      newSelected.delete(index);
                    } else {
                      newSelected.add(index);
                    }
                    setSelectedContractors(newSelected);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={selectedContractors.has(index)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <h3 className="font-semibold">{contractor.business_name}</h3>
                      </div>
                      
                      <div className="space-y-1 ml-6">
                        {contractor.rating && (
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(contractor.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{contractor.rating}</span>
                            {contractor.review_count && (
                              <span className="text-xs text-slate-500">
                                ({contractor.review_count} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        {contractor.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${contractor.phone}`} className="hover:text-blue-600">
                              {contractor.phone}
                            </a>
                          </div>
                        )}

                        {contractor.address && (
                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                              {contractor.address}, {contractor.city}, {contractor.state} {contractor.zip}
                            </span>
                          </div>
                        )}

                        {contractor.source && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              {contractor.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setResults([])}>
                Back
              </Button>
              <Button 
                onClick={handleAddSelected}
                disabled={selectedContractors.size === 0}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Add {selectedContractors.size} Contractor{selectedContractors.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}