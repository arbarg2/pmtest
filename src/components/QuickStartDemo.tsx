
import React from 'react';
import { Play, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickStartDemoProps {
  onTryDemo: (address: string) => void;
}

export function QuickStartDemo({ onTryDemo }: QuickStartDemoProps) {
  const demoAddresses = [
    {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      network: 'BTC',
      description: 'Genesis Block Address - Low Risk',
      expectedRisk: 'Low'
    },
    {
      address: '0x742C5F8A8FfC1b8B5Bb4b0B5e6C5D1A8F2C3D4E5',
      network: 'ETH',
      description: 'Sample DeFi Wallet - Medium Risk',
      expectedRisk: 'Medium'
    },
    {
      address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      network: 'BTC',
      description: 'High-Activity Wallet - High Risk',
      expectedRisk: 'High'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center text-emerald-900">
          <Play className="w-5 h-5 mr-2" />
          Try It Now - No Signup Required
        </CardTitle>
        <p className="text-emerald-700 text-sm">
          Experience Rian in under 60 seconds with these sample addresses
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {demoAddresses.map((demo, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg border border-emerald-100">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {demo.network}
                </Badge>
                <Badge className={`${getRiskColor(demo.expectedRisk)} text-xs border`}>
                  {demo.expectedRisk} Risk
                </Badge>
              </div>
              <p className="font-mono text-xs text-slate-600 truncate">
                {demo.address}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {demo.description}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(demo.address)}
                className="p-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => onTryDemo(demo.address)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="w-3 h-3 mr-1" />
                Try
              </Button>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-4 border-t border-emerald-200">
          <div className="flex items-center justify-center space-x-4 text-xs text-emerald-600">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>No Registration</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
