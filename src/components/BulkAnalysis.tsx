
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { WalletRiskResponse } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EnhancedWalletResults from './EnhancedWalletResults';

interface BulkAnalysisResult {
  address: string;
  status: 'pending' | 'completed' | 'error';
  data?: WalletRiskResponse;
  error?: string;
}

export function BulkAnalysis() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkAnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<WalletRiskResponse | null>(null);
  const { analyzeWallet } = useWalletAnalysis();
  const { toast } = useToast();

  const parseCSV = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const addresses: string[] = [];
    
    lines.forEach(line => {
      const cells = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
      cells.forEach(cell => {
        // Basic validation for Bitcoin/Ethereum addresses
        if (cell.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/) || 
            cell.match(/^0x[a-fA-F0-9]{40}$/)) {
          addresses.push(cell);
        }
      });
    });
    
    return [...new Set(addresses)]; // Remove duplicates
  };

  const parseJSON = (text: string): string[] => {
    try {
      const data = JSON.parse(text);
      const addresses: string[] = [];
      
      const extractAddresses = (obj: any) => {
        if (typeof obj === 'string') {
          if (obj.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/) || 
              obj.match(/^0x[a-fA-F0-9]{40}$/)) {
            addresses.push(obj);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(extractAddresses);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(extractAddresses);
        }
      };
      
      extractAddresses(data);
      return [...new Set(addresses)]; // Remove duplicates
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResults([]);
    
    try {
      const text = await file.text();
      let addresses: string[] = [];
      
      if (file.name.endsWith('.csv')) {
        addresses = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        addresses = parseJSON(text);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files.');
      }
      
      if (addresses.length === 0) {
        throw new Error('No valid wallet addresses found in the file.');
      }
      
      toast({
        title: "File Processed",
        description: `Found ${addresses.length} unique wallet addresses. Starting analysis...`,
      });
      
      // Initialize results
      const initialResults: BulkAnalysisResult[] = addresses.map(address => ({
        address,
        status: 'pending'
      }));
      setResults(initialResults);
      
      // Process addresses sequentially to avoid overwhelming the API
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        try {
          const analysisData = await analyzeWallet(address);
          if (analysisData) {
            setResults(prev => prev.map(result => 
              result.address === address 
                ? { ...result, status: 'completed', data: analysisData }
                : result
            ));
          }
        } catch (error) {
          setResults(prev => prev.map(result => 
            result.address === address 
              ? { ...result, status: 'error', error: error instanceof Error ? error.message : 'Analysis failed' }
              : result
          ));
        }
        
        // Add small delay between requests
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const completed = results.filter(r => r.status === 'completed').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Bulk Analysis Complete",
        description: `${completed} addresses analyzed successfully, ${failed} failed. All records stored for compliance.`,
      });
      
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      processFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or JSON file containing wallet addresses.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const getStatusIcon = (status: BulkAnalysisResult['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: BulkAnalysisResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Upload className="w-6 h-6 mr-3 text-blue-600" />
            Bulk Wallet Analysis
          </CardTitle>
          <p className="text-slate-600">
            Upload CSV or JSON files containing wallet addresses for batch analysis. All results are automatically stored for compliance and audit purposes.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Wallet Addresses</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your CSV or JSON file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
            </label>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="font-medium">Processing bulk analysis...</span>
              </div>
              <p className="text-sm text-blue-600">
                This may take a few minutes depending on the number of addresses.
              </p>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analysis Results ({results.length})</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">
                      {results.filter(r => r.status === 'completed').length} Completed
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600">
                      {results.filter(r => r.status === 'pending').length} Pending
                    </Badge>
                    <Badge variant="outline" className="text-red-600">
                      {results.filter(r => r.status === 'error').length} Failed
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {result.address.slice(0, 8)}...{result.address.slice(-6)}
                        </code>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.data && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Analysis Details</DialogTitle>
                              </DialogHeader>
                              <EnhancedWalletResults
                                wallet={result.data}
                                onBack={() => {}}
                                onViewFlow={() => {}}
                                onGenerateReport={() => {}}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                        {result.error && (
                          <span className="text-xs text-red-600 max-w-xs truncate" title={result.error}>
                            {result.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
