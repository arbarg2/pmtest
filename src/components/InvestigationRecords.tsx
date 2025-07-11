
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Eye, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Hash,
  Calendar,
  Copy
} from 'lucide-react';

interface InvestigationRecord {
  recordId: string;
  address: string;
  riskScore: number;
  riskLevel: string;
  analysisDate: string;
  entityType?: string;
  transactionCount: number;
}

// Mock data representing persistent investigation records
const mockRecords: InvestigationRecord[] = [
  {
    recordId: 'LR_240711_001',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    riskScore: 2.3,
    riskLevel: 'Low',
    analysisDate: '2024-07-11T14:30:00Z',
    entityType: 'Exchange',
    transactionCount: 1247
  },
  {
    recordId: 'LR_240711_002',
    address: '3FupnqvCJWD9EF1vXFVsJqWcUCVmnHsrKz',
    riskScore: 6.8,
    riskLevel: 'Medium',
    analysisDate: '2024-07-11T13:15:00Z',
    entityType: 'Mixer',
    transactionCount: 89
  },
  {
    recordId: 'LR_240710_003',
    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    riskScore: 8.9,
    riskLevel: 'High',
    analysisDate: '2024-07-10T16:45:00Z',
    entityType: 'Unknown',
    transactionCount: 342
  }
];

export function InvestigationRecords() {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800',
          icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800',
          icon: <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800',
          icon: <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        };
    }
  };

  const copyRecordId = (recordId: string) => {
    navigator.clipboard.writeText(recordId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
            Investigation Records
          </div>
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
            {mockRecords.length} Persistent Records
          </Badge>
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-300">
          All wallet analyses are automatically saved with unique Record IDs for audit trails and investigation continuity
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockRecords.map((record) => {
          const riskConfig = getRiskConfig(record.riskLevel);
          
          return (
            <div key={record.recordId} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <code className="text-sm font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded font-medium text-blue-600 dark:text-blue-400">
                      {record.recordId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyRecordId(record.recordId)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${riskConfig.color} text-xs px-2 py-1 font-medium`}>
                    {riskConfig.icon}
                    <span className="ml-1">{record.riskLevel}</span>
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {record.riskScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Risk Score</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="bg-white dark:bg-slate-900 rounded p-3 border">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Address:</span>
                    {record.entityType && (
                      <Badge variant="outline" className="text-xs">
                        {record.entityType}
                      </Badge>
                    )}
                  </div>
                  <code className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                    {record.address}
                  </code>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {formatDate(record.analysisDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {record.transactionCount} transactions
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Analysis
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
          Records persist across sessions and are linked to your account via secure multi-tenant architecture
        </div>
      </CardContent>
    </Card>
  );
}
