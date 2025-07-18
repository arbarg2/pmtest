
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
        {/* Enhanced Preview Canvas */}
        <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg mb-4 overflow-hidden">
          {/* Enhanced network preview with color-coded nodes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative group">
              {/* Center node - Target Wallet */}
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold z-10 relative hover:scale-110 transition-transform cursor-pointer group">
                W
                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Target: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                </div>
              </div>
              
              {/* Connected nodes with enhanced styling */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const radius = 70;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                // Determine node risk and type
                const nodeTypes = ['exchange', 'mixer', 'unknown', 'clean'];
                const nodeType = nodeTypes[i % 4];
                const isRisky = nodeType === 'mixer';
                const isExchange = nodeType === 'exchange';
                const isClean = nodeType === 'clean';
                
                let nodeColor = 'bg-gray-400'; // Unknown
                let borderColor = 'border-gray-300';
                let tooltip = 'Unknown Entity';
                
                if (isRisky) {
                  nodeColor = 'bg-red-500';
                  borderColor = 'border-red-400';
                  tooltip = 'Sanctioned/Mixer';
                } else if (isExchange) {
                  nodeColor = 'bg-green-500';
                  borderColor = 'border-green-400';
                  tooltip = 'Exchange';
                } else if (isClean) {
                  nodeColor = 'bg-blue-500';
                  borderColor = 'border-blue-400';
                  tooltip = 'Clean Wallet';
                }
                
                return (
                  <div key={i} className="group">
                    {/* Connection line with enhanced styling */}
                    <div 
                      className={`absolute w-0.5 origin-left transition-colors ${
                        isRisky ? 'bg-red-300' : 'bg-slate-300'
                      } dark:bg-slate-600`}
                      style={{
                        height: `${radius}px`,
                        left: '20px',
                        top: '20px',
                        transform: `rotate(${angle}rad)`,
                        transformOrigin: '0 0'
                      }}
                    />
                    {/* Enhanced Node */}
                    <div 
                      className={`absolute w-5 h-5 rounded-full ${nodeColor} border-2 ${borderColor} hover:scale-125 transition-all duration-200 cursor-pointer group shadow-sm`}
                      style={{
                        left: `${20 + x - 10}px`,
                        top: `${20 + y - 10}px`
                      }}
                    >
                      {/* Hover tooltip for nodes */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {tooltip}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Enhanced network stats overlay */}
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-lg p-3 border shadow-sm">
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600">Sanctioned: 2</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Clean: 4</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">Unknown: 2</span>
              </div>
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
