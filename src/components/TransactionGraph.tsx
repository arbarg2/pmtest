
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ZoomIn, ZoomOut, RotateCcw, Download, Info, GitBranch, Activity } from 'lucide-react';

interface TransactionGraphProps {
  address: string;
  wallet?: any;
}

interface GraphNode {
  id: string;
  address: string;
  type: 'target' | 'counterparty' | 'exchange' | 'mixer' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high';
  transactionCount: number;
  totalValue: number;
  label?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  value: number;
  transactionCount: number;
  direction: 'inbound' | 'outbound';
  riskScore: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    riskNodes: number;
    maxDepth: number;
  };
}

// Mock data for demonstration when real data is not available
const generateMockGraphData = (targetAddress: string): GraphData => {
  const mockNodes: GraphNode[] = [
    {
      id: targetAddress,
      address: targetAddress,
      type: 'target',
      riskLevel: 'medium',
      transactionCount: 156,
      totalValue: 45.7,
      label: 'Target Wallet'
    },
    {
      id: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1',
      address: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1',
      type: 'exchange',
      riskLevel: 'low',
      transactionCount: 1250,
      totalValue: 2340.5,
      label: 'Binance Hot Wallet'
    },
    {
      id: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1',
      address: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1',
      type: 'mixer',
      riskLevel: 'high',
      transactionCount: 45,
      totalValue: 12.3,
      label: 'Tornado Cash'
    },
    {
      id: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      type: 'unknown',
      riskLevel: 'low',
      transactionCount: 1,
      totalValue: 50.0,
      label: 'Genesis Block'
    },
    {
      id: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7',
      address: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7',
      type: 'counterparty',
      riskLevel: 'medium',
      transactionCount: 23,
      totalValue: 8.9,
      label: 'Unknown Wallet'
    },
    {
      id: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0',
      address: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0',
      type: 'counterparty',
      riskLevel: 'high',
      transactionCount: 89,
      totalValue: 156.7,
      label: 'Suspicious Entity'
    }
  ];

  const mockEdges: GraphEdge[] = [
    {
      from: targetAddress,
      to: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1',
      value: 15.5,
      transactionCount: 12,
      direction: 'outbound',
      riskScore: 0.1
    },
    {
      from: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1',
      to: targetAddress,
      value: 20.3,
      transactionCount: 8,
      direction: 'inbound',
      riskScore: 0.1
    },
    {
      from: targetAddress,
      to: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1',
      value: 5.2,
      transactionCount: 3,
      direction: 'outbound',
      riskScore: 0.9
    },
    {
      from: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7',
      to: targetAddress,
      value: 3.1,
      transactionCount: 5,
      direction: 'inbound',
      riskScore: 0.4
    },
    {
      from: targetAddress,
      to: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0',
      value: 12.8,
      transactionCount: 15,
      direction: 'outbound',
      riskScore: 0.8
    }
  ];

  return {
    nodes: mockNodes,
    edges: mockEdges,
    metadata: {
      totalNodes: mockNodes.length,
      totalEdges: mockEdges.length,
      riskNodes: mockNodes.filter(n => n.riskLevel === 'high').length,
      maxDepth: 2
    }
  };
};

const getNodeColor = (type: string, riskLevel: string) => {
  if (type === 'target') return '#3b82f6'; // Blue for target
  if (riskLevel === 'high') return '#ef4444'; // Red for high risk
  if (riskLevel === 'medium') return '#f59e0b'; // Orange for medium risk
  return '#10b981'; // Green for low risk
};

const getNodeSize = (transactionCount: number) => {
  return Math.max(8, Math.min(32, 8 + (transactionCount / 100) * 16));
};

export const TransactionGraph: React.FC<TransactionGraphProps> = ({ address, wallet }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    // Check if we have real transaction graph data
    const realGraphData = wallet?.transaction_graph || wallet?.analysis_data?.transaction_graph;
    
    if (realGraphData && realGraphData.nodes && realGraphData.nodes.length > 0) {
      setGraphData(realGraphData);
      setIsUsingMockData(false);
    } else {
      // Fall back to mock data
      const mockData = generateMockGraphData(address);
      setGraphData(mockData);
      setIsUsingMockData(true);
    }
  }, [address, wallet]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleExport = () => {
    if (!graphData) return;
    
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-graph-${address.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!graphData) {
    return (
      <div className="space-y-4">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600">Loading transaction graph...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle edge case: single node (wallet with no counterparties)
  if (graphData.nodes.length === 1) {
    return (
      <div className="space-y-4">
        {isUsingMockData && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Mock Data:</strong> This visualization uses sample data for demonstration purposes.
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <GitBranch className="w-5 h-5 mr-2 text-primary" />
                Isolated Wallet Analysis
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                W
              </div>
              <h3 className="text-lg font-semibold mb-2">No Connected Wallets Found</h3>
              <p className="text-slate-600 mb-4">
                This wallet appears to have no transaction relationships with other addresses in our current dataset.
              </p>
              <Badge variant="outline">Isolated Entity</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isUsingMockData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Mock Data:</strong> This visualization uses sample data for demonstration purposes. Real transaction data will be displayed when available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Graph Visualization */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <GitBranch className="w-5 h-5 mr-2 text-primary" />
                  Transaction Network Graph
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
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
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
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>High Risk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-50 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                {/* SVG Graph Visualization */}
                <svg className="w-full h-full">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                  </defs>
                  
                  {/* Render edges first (so they appear behind nodes) */}
                  {graphData.edges.map((edge, index) => {
                    const fromNode = graphData.nodes.find(n => n.id === edge.from);
                    const toNode = graphData.nodes.find(n => n.id === edge.to);
                    
                    if (!fromNode || !toNode) return null;
                    
                    // Calculate positions (simplified circle layout)
                    const centerX = 400;
                    const centerY = 300;
                    const radius = 200;
                    const fromIndex = graphData.nodes.findIndex(n => n.id === edge.from);
                    const toIndex = graphData.nodes.findIndex(n => n.id === edge.to);
                    
                    const fromAngle = fromIndex === 0 ? 0 : (fromIndex / (graphData.nodes.length - 1)) * 2 * Math.PI;
                    const toAngle = toIndex === 0 ? 0 : (toIndex / (graphData.nodes.length - 1)) * 2 * Math.PI;
                    
                    const fromX = fromIndex === 0 ? centerX : centerX + Math.cos(fromAngle) * radius;
                    const fromY = fromIndex === 0 ? centerY : centerY + Math.sin(fromAngle) * radius;
                    const toX = toIndex === 0 ? centerX : centerX + Math.cos(toAngle) * radius;
                    const toY = toIndex === 0 ? centerY : centerY + Math.sin(toAngle) * radius;
                    
                    const strokeWidth = Math.max(1, edge.value / 10);
                    const strokeColor = edge.riskScore > 0.7 ? '#ef4444' : edge.riskScore > 0.3 ? '#f59e0b' : '#64748b';
                    
                    return (
                      <line
                        key={`edge-${index}`}
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        markerEnd="url(#arrowhead)"
                        opacity={0.7}
                      />
                    );
                  })}
                  
                  {/* Render nodes */}
                  {graphData.nodes.map((node, index) => {
                    const centerX = 400;
                    const centerY = 300;
                    const radius = 200;
                    
                    // Target wallet in center, others in circle
                    const x = index === 0 ? centerX : centerX + Math.cos((index / (graphData.nodes.length - 1)) * 2 * Math.PI) * radius;
                    const y = index === 0 ? centerY : centerY + Math.sin((index / (graphData.nodes.length - 1)) * 2 * Math.PI) * radius;
                    
                    const nodeSize = getNodeSize(node.transactionCount);
                    const nodeColor = getNodeColor(node.type, node.riskLevel);
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeSize}
                          fill={nodeColor}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleNodeClick(node)}
                        />
                        <text
                          x={x}
                          y={y + nodeSize + 15}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                          style={{ fontSize: '10px' }}
                        >
                          {node.label || `${node.address.slice(0, 6)}...`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Network stats overlay */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                  <div className="font-medium text-slate-900 mb-2">Network Statistics</div>
                  <div className="space-y-1 text-slate-600">
                    <div>Connected Wallets: {graphData.metadata.totalNodes - 1}</div>
                    <div>Total Connections: {graphData.metadata.totalEdges}</div>
                    <div>High Risk Nodes: {graphData.metadata.riskNodes}</div>
                    <div>Max Depth: {graphData.metadata.maxDepth}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Node Details */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                {selectedNode ? 'Node Details' : 'Network Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Address</label>
                    <p className="font-mono text-xs bg-slate-100 p-2 rounded break-all">
                      {selectedNode.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Type</label>
                    <Badge variant="outline" className="ml-2">
                      {selectedNode.type}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Risk Level</label>
                    <Badge 
                      variant={selectedNode.riskLevel === 'high' ? 'destructive' : 'default'} 
                      className="ml-2"
                    >
                      {selectedNode.riskLevel}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Transactions</label>
                    <p className="text-lg font-bold">{selectedNode.transactionCount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Total Value</label>
                    <p className="text-lg font-bold">{selectedNode.totalValue} ETH</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Nodes</span>
                    <span className="font-bold">{graphData.metadata.totalNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Edges</span>
                    <span className="font-bold">{graphData.metadata.totalEdges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Risk Nodes</span>
                    <span className="font-bold text-red-600">{graphData.metadata.riskNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Max Depth</span>
                    <span className="font-bold">{graphData.metadata.maxDepth}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    Click on any node to view detailed information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Summary */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Low Risk</div>
                  <div className="font-bold text-green-700">
                    {graphData.nodes.filter(n => n.riskLevel === 'low').length}
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600">Medium Risk</div>
                  <div className="font-bold text-yellow-700">
                    {graphData.nodes.filter(n => n.riskLevel === 'medium').length}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600">High Risk</div>
                  <div className="font-bold text-red-700">
                    {graphData.nodes.filter(n => n.riskLevel === 'high').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
