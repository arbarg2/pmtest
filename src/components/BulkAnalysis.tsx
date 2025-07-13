import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeWalletRisk } from '@/services/api';
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
}

export const BulkAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
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

    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const addresses = lines.slice(1).map(line => line.split(',')[0].trim()).filter(addr => addr);

      if (addresses.length === 0) {
        toast({
          title: "No Addresses Found",
          description: "Please ensure your CSV has addresses in the first column",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (addresses.length > 100) {
        toast({
          title: "Too Many Addresses",
          description: "Maximum 100 addresses per upload",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const analysisResults: AnalysisResult[] = [];
      
      // Process addresses in batches to avoid overwhelming the system
      for (let i = 0; i < addresses.length; i += 5) {
        const batch = addresses.slice(i, i + 5);
        const batchPromises = batch.map(async (address) => {
          try {
            console.log(`Processing address: ${address}`);
            const startTime = Date.now();
            const result = await analyzeWalletRisk(address);
            const processingTime = Date.now() - startTime;
            
            // Normalize network field - ensure proper values
            let normalizedNetwork = 'ethereum'; // default to ethereum
            if (result.network) {
              normalizedNetwork = result.network.toLowerCase() === 'bitcoin' ? 'bitcoin' : 'ethereum';
            }
            
            console.log(`Creating database record for ${address} with network: ${normalizedNetwork}`);
            
            // Store in database with explicit user ID
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

            console.log(`Database result for ${address}:`, dbResult);

            let recordId = undefined;
            if (dbResult.success && dbResult.record) {
              recordId = dbResult.record.record_id;
              console.log(`Generated record ID: ${recordId}`);
              
              // Calculate and store risk factors in background
              try {
                await riskFactorsService.calculateAndStoreRiskFactors(dbResult.record.id, result);
                
                // Screen for sanctions
                const sanctionsResults = await riskFactorsService.screenSanctions(address, normalizedNetwork);
                if (sanctionsResults.length > 0) {
                  await riskFactorsService.storeSanctionsScreening(dbResult.record.id, sanctionsResults);
                }
              } catch (error) {
                console.error('Error calculating risk factors for bulk analysis:', error);
              }
            } else {
              console.error(`Failed to create database record for ${address}:`, dbResult.error);
            }
            
            return {
              address,
              risk_level: result.risk_level || 'Low',
              risk_score: result.risk_score || 0,
              status: recordId ? 'Complete' : 'Error - No Record ID',
              entity_type: result.entity_attribution?.type || 'Unknown',
              processing_time: processingTime,
              recordId
            };
          } catch (error) {
            console.error('Error analyzing address:', address, error);
            return {
              address,
              risk_level: 'Unknown',
              risk_score: 0,
              status: 'Error',
              entity_type: 'Unknown'
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        analysisResults.push(...batchResults);
        
        // Update progress
        toast({
          title: "Processing...",
          description: `Analyzed ${analysisResults.length} of ${addresses.length} addresses`,
        });
      }
      
      setResults(analysisResults);
      
      const successfulRecords = analysisResults.filter(r => r.recordId);
      
      toast({
        title: "Bulk Analysis Complete",
        description: `Successfully processed ${analysisResults.length} addresses. ${successfulRecords.length} records created in database.`,
      });
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process bulk analysis",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const headers = ['Address', 'Risk Level', 'Risk Score', 'Entity Type', 'Status', 'Processing Time (ms)', 'Record ID'];
    const csvContent = [
      headers,
      ...results.map(result => [
        result.address,
        result.risk_level,
        result.risk_score.toString(),
        result.entity_type || 'Unknown',
        result.status,
        result.processing_time?.toString() || 'N/A',
        result.recordId || 'N/A'
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
  };

  return (
    <Card className="bg-white/90 backdrop-blur shadow-xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Upload className="w-6 h-6 mr-3 text-primary" />
          Bulk Wallet Analysis
        </CardTitle>
        <p className="text-slate-600">
          Upload a CSV file with wallet addresses for batch processing and comprehensive risk assessment
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="font-semibold text-lg mb-2">Upload CSV File</h3>
            <p className="text-slate-600 mb-4">
              Select a CSV file containing wallet addresses to analyze. 
              The file should have addresses in the first column.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Choose File'}
            </label>
            {uploadedFile && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: {uploadedFile.name}
              </p>
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
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-slate-600 mb-2">
                <div>Address</div>
                <div>Risk Level</div>
                <div>Entity Type</div>
                <div>Status</div>
                <div>Record ID</div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-center p-3 bg-white rounded border text-sm">
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 mr-3 animate-spin text-primary" />
            <span className="text-lg">Processing bulk analysis...</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• First column should contain wallet addresses</li>
            <li>• Supports Bitcoin and Ethereum addresses</li>
            <li>• Maximum 100 addresses per upload</li>
            <li>• Results include risk scores, entity attribution, and compliance flags</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
