import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertTriangle, CheckCircle, Clock, FileText, File, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';

interface AnalysisResult {
  address: string;
  risk_level: string;
  risk_score: number;
  status: string;
  entity_type?: string;
  processing_time?: number;
  recordId?: string;
  error?: string;
}

export const BulkAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();
  const { user } = useAuth();

  const processAddressesFromText = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')) // Allow comments with #
      .map(line => line.split(',')[0].trim()) // Take first column if CSV
      .filter(addr => addr);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Support multiple file types
    const supportedTypes = ['.csv', '.txt', '.tsv'];
    const isSupported = supportedTypes.some(type => file.name.toLowerCase().endsWith(type));
    
    if (!isSupported) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV, TXT, or TSV file",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform bulk analysis",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      const addresses = processAddressesFromText(text);

      if (addresses.length === 0) {
        toast({
          title: "No Addresses Found",
          description: "Please ensure your file has valid wallet addresses",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setAddressCount(addresses.length);
      
      toast({
        title: "File Uploaded Successfully",
        description: `Found ${addresses.length} wallet addresses ready for analysis`,
      });

      // Start processing immediately
      await processBulkAnalysis(addresses);
      
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "Failed to read the uploaded file",
        variant: "destructive",
      });
    }
  };

  const processBulkAnalysis = async (addresses: string[]) => {
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: addresses.length });
    
    try {
      const analysisResults: AnalysisResult[] = [];
      const batchSize = 3; // Reduced batch size for better performance
      
      // Process addresses in smaller batches to avoid overwhelming the system
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (address, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          try {
            console.log(`Processing address ${globalIndex + 1}/${addresses.length}: ${address}`);
            const startTime = Date.now();
            const result = await analyzeWalletWithRealData(address);
            const processingTime = Date.now() - startTime;
            
            // Fix network normalization
            let normalizedNetwork = 'ethereum';
            if (result.network) {
              const networkLower = result.network.toLowerCase();
              if (networkLower === 'bitcoin' || networkLower === 'btc') {
                normalizedNetwork = 'bitcoin';
              } else if (networkLower === 'ethereum' || networkLower === 'eth') {
                normalizedNetwork = 'ethereum';
              }
            }
            
            console.log(`Creating database record for ${address}`);
            
            // Store in database
            const dbResult = await supabaseLookupRecords.createLookupRecord({
              wallet_address: address,
              network: normalizedNetwork,
              risk_score: result.risk_score || 0,
              risk_level: result.risk_level || 'Low',
              processing_time_ms: processingTime,
              risk_assessment: {
                risk_score: result.risk_score || 0,
                risk_level: result.risk_level || 'Low',
                risk_factors: result.risk_factors || {},
                explanation: result.explanation || '',
                entity_attribution: result.entity_attribution || null,
                volume_metrics: result.volume_metrics || null,
                geographic_risk: result.geographic_risk || null,
                sanctions_exposure: result.sanctions_exposure || null,
                top_counterparties: result.top_counterparties || [],
                temporal_patterns: result.temporal_patterns || null,
                behavioral_classification: result.behavioral_classification || null,
                transaction_count: result.transaction_count || 0,
                last_activity: result.last_activity || null,
                processing_time_ms: processingTime,
                full_wallet_data: result
              },
              analyst_fields: {
                case_notes: '',
                analyst_decision: 'pending',
                tags: [],
                attachments: []
              }
            }, user.id);

            let recordId = undefined;
            let status = 'Error';
            let errorMessage = '';

            if (dbResult.success && dbResult.record) {
              recordId = dbResult.record.record_id;
              status = 'Complete';
              
              // Process risk factors and sanctions in background
              try {
                await riskFactorsService.calculateAndStoreRiskFactors(dbResult.record.id, result);
                const sanctionsResults = await riskFactorsService.screenSanctions(address, normalizedNetwork);
                if (sanctionsResults.length > 0) {
                  await riskFactorsService.storeSanctionsScreening(dbResult.record.id, sanctionsResults);
                }
              } catch (error) {
                console.error('Error calculating risk factors:', error);
              }
            } else {
              console.error(`Failed to create database record for ${address}:`, dbResult.error);
              errorMessage = dbResult.error || 'Unknown database error';
              status = `Error: ${errorMessage}`;
            }
            
            // Update progress
            setProcessingProgress(prev => ({ ...prev, current: globalIndex + 1 }));
            
            return {
              address,
              risk_level: result.risk_level || 'Low',
              risk_score: result.risk_score || 0,
              status,
              entity_type: result.entity_attribution?.type || 'Unknown',
              processing_time: processingTime,
              recordId,
              error: errorMessage
            };
          } catch (error) {
            console.error('Error analyzing address:', address, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            setProcessingProgress(prev => ({ ...prev, current: globalIndex + 1 }));
            
            return {
              address,
              risk_level: 'Unknown',
              risk_score: 0,
              status: `Error: ${errorMessage}`,
              entity_type: 'Unknown',
              error: errorMessage
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        analysisResults.push(...batchResults);
        
        // Update UI with current results
        setResults([...analysisResults]);
        
        // Show progress toast
        if (i + batchSize < addresses.length) {
          toast({
            title: "Processing...",
            description: `Analyzed ${analysisResults.length} of ${addresses.length} addresses`,
          });
        }
        
        // Brief pause between batches to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setResults(analysisResults);
      
      const successfulRecords = analysisResults.filter(r => r.recordId);
      const failedRecords = analysisResults.filter(r => !r.recordId);
      
      toast({
        title: "Bulk Analysis Complete",
        description: `Processed ${analysisResults.length} addresses. ${successfulRecords.length} successful, ${failedRecords.length} failed.`,
        variant: failedRecords.length > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Processing Failed",
        description: `Failed to process bulk analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const headers = ['Address', 'Risk Level', 'Risk Score', 'Entity Type', 'Status', 'Processing Time (ms)', 'Record ID', 'Error'];
    const csvContent = [
      headers,
      ...results.map(result => [
        result.address,
        result.risk_level,
        result.risk_score.toString(),
        result.entity_type || 'Unknown',
        result.status,
        result.processing_time?.toString() || 'N/A',
        result.recordId || 'N/A',
        result.error || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-analysis-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setResults([]);
    setUploadedFile(null);
    setAddressCount(0);
    setProcessingProgress({ current: 0, total: 0 });
  };

  const removeFile = () => {
    setUploadedFile(null);
    setAddressCount(0);
  };

  return (
    <Card className="bg-white/90 backdrop-blur shadow-xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Upload className="w-6 h-6 mr-3 text-primary" />
          Bulk Wallet Analysis
        </CardTitle>
        <p className="text-slate-600">
          Upload a file with wallet addresses for batch processing. Supports unlimited addresses.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.length === 0 ? (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="font-semibold text-lg mb-2">Upload File</h3>
              <p className="text-slate-600 mb-4">
                Select a CSV, TXT, or TSV file containing wallet addresses.
                No limit on number of addresses.
              </p>
              
              {uploadedFile ? (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-blue-900">{uploadedFile.name}</div>
                        <div className="text-sm text-blue-600">{addressCount} addresses found</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </label>
                </>
              )}
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 animate-spin text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">Processing Bulk Analysis</h4>
                      <p className="text-sm text-blue-600">
                        {processingProgress.current} of {processingProgress.total} addresses completed
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((processingProgress.current / processingProgress.total) * 100)}%
                  </div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Analysis Results ({results.length})</h3>
              <div className="flex space-x-2">
                <Button onClick={downloadResults} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={clearResults} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-slate-600 mb-2">
                <div>Address</div>
                <div>Risk Level</div>
                <div>Entity Type</div>
                <div>Status</div>
                <div>Record ID</div>
                <div>Error</div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 items-center p-3 bg-white rounded border text-sm">
                    <div className="font-mono text-xs truncate" title={result.address}>
                      {result.address.length > 20 ? `${result.address.slice(0, 10)}...${result.address.slice(-8)}` : result.address}
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.risk_level === 'High' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : result.risk_level === 'Medium' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.risk_level === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : result.risk_level === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {result.risk_level} ({result.risk_score?.toFixed(1)})
                      </span>
                    </div>
                    <div className="text-slate-600 capitalize">
                      {result.entity_type}
                    </div>
                    <div className="flex items-center space-x-1">
                      {result.status === 'Complete' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : result.status.includes('Error') ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">{result.status}</span>
                    </div>
                    <div className="font-mono text-xs">
                      {result.recordId ? result.recordId.slice(0, 10) + '...' : 'N/A'}
                    </div>
                    <div className="text-xs text-red-600 truncate" title={result.error}>
                      {result.error || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">File Format Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Supports CSV, TXT, and TSV files</li>
            <li>• First column should contain wallet addresses</li>
            <li>• Supports Bitcoin and Ethereum addresses</li>
            <li>• No limit on number of addresses</li>
            <li>• Lines starting with # are treated as comments</li>
            <li>• Results include risk scores, entity attribution, and compliance flags</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
