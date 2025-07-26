import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Upload, FileSpreadsheet, Trash2, Eye, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';
import { useToast } from '@/hooks/use-toast';
import { validateWalletAddress } from '@/services/walletValidation';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { logAuditAction } from '@/utils/auditLogger';
import Papa from 'papaparse';

interface ParsedRecord {
  address: string;
  type: 'BTC' | 'ETH' | 'Unknown';
  status: 'Ready' | 'Processing' | 'Complete' | 'Duplicate' | 'Error';
  recordId?: string;
  error?: string;
}

interface UploadAudit {
  filename: string;
  fileSize: number;
  uploadTime: string;
  addressCount: number;
  fileType: string;
  rawData: string[];
}

const BulkAnalysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [uploadAudit, setUploadAudit] = useState<UploadAudit | null>(null);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const detectAddressType = (address: string): 'BTC' | 'ETH' | 'Unknown' => {
    const trimmedAddress = address.trim();
    
    if (trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'ETH';
    }
    
    if (trimmedAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || trimmedAddress.startsWith('bc1')) {
      return 'BTC';
    }
    
    return 'Unknown';
  };

  const parseFileContent = useCallback((content: string, fileType: 'csv' | 'json'): { addresses: string[], rawData: string[] } => {
    try {
      let addresses: string[] = [];
      let rawData: string[] = [];

      if (fileType === 'csv') {
        const result = Papa.parse(content, {
          header: true,
          skipEmptyLines: true
        });
        
        // Store raw data for display
        rawData = result.data.map((row: any, index: number) => 
          `Row ${index + 1}: ${JSON.stringify(row)}`
        );
        
        addresses = result.data.map((row: any) => {
          // Try different possible column names
          return row.address || row.wallet_address || row.Address || row['Wallet Address'] || Object.values(row)[0];
        }).filter(Boolean);
      } else if (fileType === 'json') {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          rawData = data.map((item, index) => 
            `Item ${index + 1}: ${JSON.stringify(item)}`
          );
          addresses = data.map(item => {
            if (typeof item === 'string') return item;
            return item.address || item.wallet_address || item.Address;
          }).filter(Boolean);
        } else if (data.addresses && Array.isArray(data.addresses)) {
          rawData = data.addresses.map((addr: any, index: number) => 
            `Address ${index + 1}: ${addr}`
          );
          addresses = data.addresses;
        }
      }

      if (addresses.length === 0) {
        throw new Error('No addresses found in file');
      }

      if (addresses.length > 100) {
        throw new Error('Maximum 100 addresses allowed per batch');
      }

      return { addresses, rawData };
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'json'].includes(fileExtension || '')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or JSON file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const { addresses, rawData } = parseFileContent(content, fileExtension as 'csv' | 'json');
        
        // Create audit record
        const auditInfo: UploadAudit = {
          filename: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
          addressCount: addresses.length,
          fileType: fileExtension as string,
          rawData: rawData
        };
        
        setUploadAudit(auditInfo);
        
        // Log the upload audit
        if (user) {
          await logAuditAction('bulk_upload', undefined, {
            filename: file.name,
            file_size: file.size,
            address_count: addresses.length,
            file_type: fileExtension,
            upload_timestamp: auditInfo.uploadTime
          });
        }

        const records: ParsedRecord[] = addresses.map(address => {
          const validation = validateWalletAddress(address);
          return {
            address: address.trim(),
            type: validation.isValid ? detectAddressType(address) : 'Unknown',
            status: validation.isValid ? 'Ready' as const : 'Error' as const,
            error: validation.error
          };
        });
        
        setParsedRecords(records);
        
        toast({
          title: "File Uploaded Successfully",
          description: `Found ${records.length} wallet addresses`,
        });
      } catch (error) {
        toast({
          title: "File Processing Error",
          description: error instanceof Error ? error.message : 'Failed to process file',
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  }, [parseFileContent, toast, user]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const saveRecordsToDatabase = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    const updatedRecords = [...parsedRecords];
    
    try {
      for (let i = 0; i < updatedRecords.length; i++) {
        const record = updatedRecords[i];
        if (record.status !== 'Ready') continue;
        
        setParsedRecords(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'Processing' as const } : r
        ));

        try {
          // Check if record already exists
          const existingRecords = await supabaseLookupRecords.getLookupRecords(user.id);
          if (existingRecords.success) {
            const duplicate = existingRecords.records?.find(r => 
              r.wallet_address.toLowerCase() === record.address.toLowerCase()
            );
            
            if (duplicate) {
              updatedRecords[i] = { ...record, status: 'Duplicate' as const, recordId: duplicate.record_id };
              continue;
            }
          }

          const network = record.type === 'ETH' ? 'ethereum' : 'bitcoin';
          const result = await supabaseLookupRecords.createLookupRecord({
            wallet_address: record.address,
            network,
            risk_score: 0,
            risk_level: 'Low',
            processing_time_ms: 0,
            risk_assessment: {
              risk_score: 0,
              risk_level: 'Low',
              explanation: 'Pending analysis',
              risk_factors: {},
              processing_time_ms: 0
            },
            analyst_fields: {
              case_notes: '',
              analyst_decision: 'pending',
              tags: [],
              attachments: []
            }
          }, user.id);

          if (result.success && result.record) {
            updatedRecords[i] = { 
              ...record, 
              status: 'Complete' as const, 
              recordId: result.record.record_id 
            };
          } else {
            updatedRecords[i] = { 
              ...record, 
              status: 'Error' as const, 
              error: result.error || 'Failed to create record' 
            };
          }
        } catch (error) {
          updatedRecords[i] = { 
            ...record, 
            status: 'Error' as const, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        setParsedRecords([...updatedRecords]);
      }

      const successful = updatedRecords.filter(r => r.status === 'Complete').length;
      const duplicates = updatedRecords.filter(r => r.status === 'Duplicate').length;
      const errors = updatedRecords.filter(r => r.status === 'Error').length;

      // Log processing completion
      if (user) {
        await logAuditAction('bulk_processing_complete', undefined, {
          total_records: updatedRecords.length,
          successful,
          duplicates,
          errors,
          filename: uploadAudit?.filename
        });
      }

      toast({
        title: "Bulk Upload Complete",
        description: `${successful} created, ${duplicates} duplicates, ${errors} errors`,
        variant: errors > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearRecords = () => {
    setParsedRecords([]);
    setUploadAudit(null);
    setShowRawData(false);
  };

  const viewRecord = (recordId: string) => {
    navigate(`/all-records?record=${recordId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Bulk Analysis
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload and analyze multiple wallets
                  </p>
                </div>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="bg-white/90 backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-primary" />
              Bulk Wallet Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="font-semibold text-lg mb-2">Upload File</h3>
              <p className="text-slate-600 mb-4">
                Drag and drop a CSV or JSON file here, or click to browse.
                Maximum 100 addresses per batch.
              </p>
              
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </label>
            </div>

            {/* Upload Audit Information */}
            {uploadAudit && (
              <Card className="bg-blue-50 border border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900">Upload Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">File:</span>
                      <p className="text-blue-700">{uploadAudit.filename}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Size:</span>
                      <p className="text-blue-700">{(uploadAudit.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Addresses:</span>
                      <p className="text-blue-700">{uploadAudit.addressCount}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Uploaded:</span>
                      <p className="text-blue-700">{new Date(uploadAudit.uploadTime).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Raw Data Toggle */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRawData(!showRawData)}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      {showRawData ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                      {showRawData ? 'Hide' : 'Show'} Raw Data
                    </Button>
                  </div>
                  
                  {/* Raw Data Display */}
                  {showRawData && (
                    <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Raw File Content</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                          {uploadAudit.rawData.join('\n')}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Parsed Records Table */}
            {parsedRecords.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Parsed Records ({parsedRecords.length})
                  </h3>
                  <div className="flex space-x-2">
                    {!isProcessing && parsedRecords.some(r => r.status === 'Ready') && (
                      <Button 
                        onClick={saveRecordsToDatabase}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Save to Database
                      </Button>
                    )}
                    <Button onClick={clearRecords} variant="outline">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">#</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Wallet Address</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRecords.map((record, index) => (
                          <tr key={index} className="border-t hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-mono">
                              <div className="truncate max-w-xs" title={record.address}>
                                {record.address}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.type === 'ETH' ? 'bg-blue-100 text-blue-800' :
                                record.type === 'BTC' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {record.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                                record.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                record.status === 'Complete' ? 'bg-green-100 text-green-800' :
                                record.status === 'Duplicate' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                              {record.error && (
                                <div className="text-xs text-red-600 mt-1" title={record.error}>
                                  {record.error.length > 30 ? record.error.substring(0, 30) + '...' : record.error}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {record.recordId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewRecord(record.recordId!)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* File Format Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">File Format Requirements</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>CSV:</strong> Must have an "address" column header</li>
                <li>• <strong>JSON:</strong> Array of addresses or objects with "address" property</li>
                <li>• Supports Bitcoin (P2PKH, P2SH, Bech32) and Ethereum addresses</li>
                <li>• Maximum 100 addresses per batch</li>
                <li>• Duplicate addresses will be detected and skipped</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkAnalysis;
