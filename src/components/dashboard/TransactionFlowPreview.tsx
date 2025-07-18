
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Eye, ArrowRight } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';

interface TransactionFlowPreviewProps {
  wallet: WalletRiskResponse;
  onViewFlow: () => void;
}

const TransactionFlowPreview = ({ wallet, onViewFlow }: TransactionFlowPreviewProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-primary" />
            Transaction Flow Visualization
          </div>
          <Button onClick={onViewFlow} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Flow
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Preview Canvas */}
        <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg mb-4 overflow-hidden">
          {/* Simplified network preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Center node */}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold z-10 relative">
                W
              </div>
              
              {/* Connected nodes */}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * 2 * Math.PI;
                const radius = 60;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isRisky = i % 3 === 0;
                
                return (
                  <div key={i}>
                    {/* Connection line */}
                    <div 
                      className="absolute w-px bg-slate-300 dark:bg-slate-600 origin-left"
                      style={{
                        height: `${radius}px`,
                        left: '16px',
                        top: '16px',
                        transform: `rotate(${angle}rad)`,
                        transformOrigin: '0 0'
                      }}
                    />
                    {/* Node */}
                    <div 
                      className={`absolute w-4 h-4 rounded-full ${
                        isRisky ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        left: `${16 + x - 8}px`,
                        top: `${16 + y - 8}px`
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Network stats overlay */}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <div>Connected: 20</div>
              <div>Risk Nodes: 3</div>
            </div>
          </div>
        </div>

        {/* Flow Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Inbound Flow</div>
            <div className="font-bold text-green-700 dark:text-green-300">
              {wallet.volume_metrics?.lifetime_value?.inbound?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 mb-1">Outbound Flow</div>
            <div className="font-bold text-red-700 dark:text-red-300">
              {wallet.volume_metrics?.lifetime_value?.outbound?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Net Flow</div>
            <div className="font-bold text-blue-700 dark:text-blue-300">
              {wallet.volume_metrics?.lifetime_value?.net?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Explore detailed transaction flows and counterparty relationships
          </p>
          <Button onClick={onViewFlow} className="bg-accent hover:bg-accent/90 text-white">
            <GitBranch className="w-4 h-4 mr-2" />
            Open Interactive Flow
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFlowPreview;
