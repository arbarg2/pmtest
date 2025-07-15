
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Zap, Shield, Database } from 'lucide-react';

interface WalletLookupPanelProps {
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  stats?: {
    total_lookups: number;
    pending_review: number;
  };
}

export const WalletLookupPanel = ({
  walletAddress,
  setWalletAddress,
  onAnalyze,
  isAnalyzing,
  stats
}: WalletLookupPanelProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      onAnalyze();
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-primary" />
          <span>Wallet Intelligence Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <Input
              type="text"
              placeholder="Enter wallet address (Bitcoin, Ethereum, etc.)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1 text-sm font-mono"
              disabled={isAnalyzing}
            />
            <Button 
              type="submit"
              disabled={isAnalyzing || !walletAddress.trim()}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Analyze</span>
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Analysis Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Real-Time Analysis</h4>
            <p className="text-xs text-slate-600">Lightning-fast blockchain forensics</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Risk Assessment</h4>
            <p className="text-xs text-slate-600">20+ risk factors analyzed</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Compliance Ready</h4>
            <p className="text-xs text-slate-600">Audit trails & reporting</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-center space-x-8 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total_lookups || 0}
              </div>
              <div className="text-xs text-slate-600">Total Analyses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {stats.pending_review || 0}
              </div>
              <div className="text-xs text-slate-600">Pending Review</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
