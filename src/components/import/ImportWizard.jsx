import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const ENTITY_FIELDS = {
  Client: {
    required: ['first_name', 'last_name', 'email'],
    optional: ['phone', 'secondary_phone', 'address', 'city', 'state', 'zip', 'notes', 'tags']
  },
  Property: {
    required: ['address'],
    optional: ['name', 'city', 'state', 'zip', 'property_type', 'bedrooms', 'bathrooms', 'square_feet', 'lot_size', 'year_built', 'notes']
  }
};

export default function ImportWizard({ entityType, companyId, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importResult, setImportResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const uploadedUrl = uploadResponse.file_url;
      setFileUrl(uploadedUrl);

      // Build JSON schema for extraction
      const schema = {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true
        }
      };

      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadedUrl,
        json_schema: schema
      });

      if (extractResponse.status === 'success' && extractResponse.output) {
        const data = Array.isArray(extractResponse.output) ? extractResponse.output : [extractResponse.output];
        setParsedData(data);
        
        if (data.length > 0) {
          const cols = Object.keys(data[0]);
          setColumns(cols);
          
          // Auto-map fields with exact matches
          const autoMapping = {};
          const entityFields = [...ENTITY_FIELDS[entityType].required, ...ENTITY_FIELDS[entityType].optional];
          cols.forEach(col => {
            const normalized = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const match = entityFields.find(f => f.toLowerCase() === normalized);
            if (match) {
              autoMapping[col] = match;
            }
          });
          setFieldMapping(autoMapping);
        }
        
        setStep(2);
      } else {
        alert(extractResponse.details || 'Failed to extract data from file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Map data according to field mapping
      const mappedData = parsedData.map(row => {
        const mapped = {};
        const customFields = {};
        
        Object.keys(row).forEach(col => {
          const targetField = fieldMapping[col];
          if (targetField && targetField !== 'skip') {
            mapped[targetField] = row[col];
          } else if (!targetField || targetField === 'custom') {
            customFields[col] = row[col];
          }
        });
        
        // Add custom fields if any
        if (Object.keys(customFields).length > 0) {
          mapped.custom_fields = customFields;
        }
        
        mapped.tenant_id = companyId;
        return mapped;
      });

      // Validate required fields
      const requiredFields = ENTITY_FIELDS[entityType].required;
      const missingRequired = mappedData.some(row => 
        requiredFields.some(field => !row[field])
      );

      if (missingRequired) {
        alert(`Missing required fields: ${requiredFields.join(', ')}`);
        setImporting(false);
        return;
      }

      // Import data
      const results = await base44.entities[entityType].bulkCreate(mappedData);
      
      setImportResult({
        success: true,
        count: mappedData.length
      });
      setStep(3);
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message
      });
      setStep(3);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
            {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
          </div>
          <span className="text-sm font-medium">Upload</span>
        </div>
        <div className="h-px w-12 bg-slate-300" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
            {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
          </div>
          <span className="text-sm font-medium">Map Fields</span>
        </div>
        <div className="h-px w-12 bg-slate-300" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
            {step > 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
          </div>
          <span className="text-sm font-medium">Import</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload {entityType} Data</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing your {entityType.toLowerCase()} data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </span>
                <span className="text-slate-600"> or drag and drop</span>
              </label>
              <p className="text-sm text-slate-500 mt-2">CSV or Excel files only</p>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing file...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Fields */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Fields</CardTitle>
            <CardDescription>
              Found {parsedData.length} rows. Map your columns to {entityType} fields or mark as custom fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required fields:</strong> {ENTITY_FIELDS[entityType].required.join(', ')}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{col}</p>
                    <p className="text-xs text-slate-500">
                      Sample: {parsedData[0][col]?.toString().substring(0, 50) || 'N/A'}
                    </p>
                  </div>
                  <div className="w-48">
                    <Select
                      value={fieldMapping[col] || 'custom'}
                      onValueChange={(value) => setFieldMapping({ ...fieldMapping, [col]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip Column</SelectItem>
                        <SelectItem value="custom">Custom Field</SelectItem>
                        {ENTITY_FIELDS[entityType].required.map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, ' ')} *
                          </SelectItem>
                        ))}
                        {ENTITY_FIELDS[entityType].optional.map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldMapping[col] === 'custom' && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Custom
                    </Badge>
                  )}
                  {ENTITY_FIELDS[entityType].required.includes(fieldMapping[col]) && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Required
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${parsedData.length} ${entityType}s`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import {importResult.success ? 'Complete' : 'Failed'}</CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.success ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Successfully imported {importResult.count} {entityType.toLowerCase()}s</p>
                <Button onClick={onComplete} className="mt-4">
                  Done
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Import Failed</p>
                <p className="text-slate-600 mb-4">{importResult.error}</p>
                <Button onClick={() => setStep(2)} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}