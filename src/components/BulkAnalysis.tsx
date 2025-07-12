
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const BulkAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

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

    setIsProcessing(true);
    
    try {
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results
      const mockResults = [
        {
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          risk_level: 'Low',
          risk_score: 2.3,
          status: 'Complete'
        },
        {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          risk_level: 'High',
          risk_score: 8.7,
          status: 'Complete'
        }
      ];
      
      setResults(mockResults);
      
      toast({
        title: "Bulk Analysis Complete",
        description: `Processed ${mockResults.length} addresses`,
      });
    } catch (error) {
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
    
    const csvContent = [
      ['Address', 'Risk Level', 'Risk Score', 'Status'],
      ...results.map(result => [
        result.address,
        result.risk_level,
        result.risk_score.toString(),
        result.status
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
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Choose File'}
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 mr-3 animate-spin text-primary" />
            <span className="text-lg">Processing bulk analysis...</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <Button onClick={downloadResults} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </Button>
            </div>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {result.risk_level === 'High' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <code className="font-mono text-sm">{result.address}</code>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.risk_level === 'High' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {result.risk_level}
                    </span>
                    <span className="text-sm font-mono">{result.risk_score}</span>
                  </div>
                </div>
              ))}
            </div>
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
