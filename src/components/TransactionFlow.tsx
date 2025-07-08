
import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TransactionFlow = ({ wallet, onBack }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Center wallet node
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Draw center wallet
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Wallet', centerX, centerY + 4);

    // Generate surrounding nodes
    const nodeCount = 12;
    const radius = 120;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Determine node risk (random for demo)
      const isRisky = Math.random() > 0.7;
      const nodeColor = isRisky ? '#ef4444' : '#10b981';
      
      // Draw connection line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Draw node
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw node label
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const label = isRisky ? 'Risk' : 'Safe';
      ctx.fillText(label, x, y + 25);
    }

    // Add outer ring nodes for complexity
    const outerRadius = 200;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * outerRadius;
      const y = centerY + Math.sin(angle) * outerRadius;
      
      const isRisky = Math.random() > 0.8;
      const nodeColor = isRisky ? '#f59e0b' : '#6b7280';
      
      // Draw smaller outer nodes
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, []);

  const sampleTransactions = [
    { id: '0xa1b2c3...', type: 'Inbound', amount: '0.5 ETH', risk: 'Low', time: '2h ago' },
    { id: '0xd4e5f6...', type: 'Outbound', amount: '1.2 ETH', risk: 'High', time: '5h ago' },
    { id: '0x789abc...', type: 'Inbound', amount: '0.8 ETH', risk: 'Medium', time: '1d ago' },
    { id: '0xdef123...', type: 'Outbound', amount: '2.1 ETH', risk: 'Low', time: '2d ago' },
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Transaction Flow Visualization</h1>
                <p className="text-sm text-slate-500">Interactive network analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Visualization */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Network Visualization</CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Target Wallet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Low Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Medium Risk</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-slate-50 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-move"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                    <p className="font-medium text-slate-900">Network Stats</p>
                    <p className="text-slate-600">Connected Wallets: 20</p>
                    <p className="text-slate-600">Risk Nodes: 3</p>
                    <p className="text-slate-600">Depth: 2 levels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <div>
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleTransactions.map((tx, index) => (
                    <div key={index} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={tx.type === 'Inbound' ? 'default' : 'secondary'} className="text-xs">
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-slate-500">{tx.time}</span>
                      </div>
                      <p className="font-mono text-xs text-slate-700 mb-2">{tx.id}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{tx.amount}</span>
                        <Badge className={`${getRiskColor(tx.risk)} border text-xs`}>
                          {tx.risk}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Inbound</span>
                  <span className="font-bold text-green-600">12.5 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Outbound</span>
                  <span className="font-bold text-red-600">8.3 ETH</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-slate-900">Net Flow</span>
                  <span className="font-bold text-blue-600">+4.2 ETH</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFlow;
