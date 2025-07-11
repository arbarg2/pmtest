
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
  const { analyzeWallet } = useWalletAnalysis();
  const { toast } = useToast();

  const parseCSV = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const addresses: string[] = [];
    
    console.log('Parsing CSV, found lines:', lines.length);
    
    lines.forEach((line, index) => {
      const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
      cells.forEach(cell => {
        // Enhanced validation for Bitcoin/Ethereum addresses
        const cleanCell = cell.trim();
        if (cleanCell.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/) || 
            cleanCell.match(/^0x[a-fA-F0-9]{40}$/)) {
          addresses.push(cleanCell);
          console.log(`Found valid address on line ${index + 1}: ${cleanCell}`);
        }
      });
    });
    
    console.log('Total addresses found:', addresses.length);
    return [...new Set(addresses)]; // Remove duplicates
  };

  const parseJSON = (text: string): string[] => {
    try {
      const data = JSON.parse(text);
      const addresses: string[] = [];
      
      console.log('Parsing JSON data:', data);
      
      const extractAddresses = (obj: any, path = '') => {
        if (typeof obj === 'string') {
          const cleanStr = obj.trim();
          if (cleanStr.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/) || 
              cleanStr.match(/^0x[a-fA-F0-9]{40}$/)) {
            addresses.push(cleanStr);
            console.log(`Found address at ${path}: ${cleanStr}`);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => extractAddresses(item, `${path}[${index}]`));
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => 
            extractAddresses(value, path ? `${path}.${key}` : key)
          );
        }
      };
      
      extractAddresses(data);
      console.log('Total addresses found in JSON:', addresses.length);
      return [...new Set(addresses)]; // Remove duplicates
    } catch (error) {
      console.error('JSON parse error:', error);
      throw new Error('Invalid JSON format');
    }
  };

  const processFile = async (file: File) => {
    console.log('Processing file:', file.name, file.type, file.size);
    setIsProcessing(true);
    setResults([]);
    
    try {
      const text = await file.text();
      console.log('File content length:', text.length);
      console.log('File content preview:', text.substring(0, 200));
      
      let addresses: string[] = [];
      
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        addresses = parseCSV(text);
      } else if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
        addresses = parseJSON(text);
      } else if (file.type === 'text/plain') {
        // Try to detect format from content
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          addresses = parseJSON(text);
        } else {
          addresses = parseCSV(text);
        }
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files.');
      }
      
      if (addresses.length === 0) {
        throw new Error('No valid wallet addresses found in the file. Please ensure your file contains Bitcoin (starting with 1, 3, or bc1) or Ethereum (starting with 0x) addresses.');
      }
      
      toast({
        title: "File Processed Successfully",
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
        console.log(`Processing address ${i + 1}/${addresses.length}: ${address}`);
        
        try {
          const analysisData = await analyzeWallet(address);
          if (analysisData) {
            setResults(prev => prev.map(result => 
              result.address === address 
                ? { ...result, status: 'completed', data: analysisData }
                : result
            ));
            console.log(`Successfully analyzed: ${address}`);
          }
        } catch (error) {
          console.error(`Failed to analyze ${address}:`, error);
          setResults(prev => prev.map(result => 
            result.address === address 
              ? { ...result, status: 'error', error: error instanceof Error ? error.message : 'Analysis failed' }
              : result
          ));
        }
        
        // Add small delay between requests
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const completedCount = addresses.length;
      const failedCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Bulk Analysis Complete",
        description: `${completedCount - failedCount} addresses analyzed successfully, ${failedCount} failed. All records stored for compliance.`,
      });
      
    } catch (error) {
      console.error('File processing error:', error);
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
    
    console.log('Dropped file:', file?.name, file?.type);
    
    if (file) {
      const isValidFile = file.name.toLowerCase().endsWith('.csv') || 
                         file.name.toLowerCase().endsWith('.json') ||
                         file.type === 'text/csv' ||
                         file.type === 'application/json' ||
                         file.type === 'text/plain';
      
      if (isValidFile) {
        processFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or JSON file containing wallet addresses.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Selected file:', file?.name, file?.type);
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
            Upload CSV or JSON files containing wallet addresses for batch analysis. Supported formats: Bitcoin (1..., 3..., bc1...) and Ethereum (0x...) addresses.
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
              accept=".csv,.json,text/csv,application/json,text/plain"
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
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {result.address.slice(0, 12)}...{result.address.slice(-8)}
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
