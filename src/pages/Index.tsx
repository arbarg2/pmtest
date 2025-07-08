
import React, { useState } from 'react';
import { Search, Shield, TrendingUp, FileText, Zap, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import WalletResults from '@/components/WalletResults';
import TransactionFlow from '@/components/TransactionFlow';
import ReportGenerator from '@/components/ReportGenerator';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentWallet, setCurrentWallet] = useState(null);

  const handleWalletCheck = () => {
    if (walletAddress.trim()) {
      // Generate placeholder risk data
      const riskScores = ['Low', 'Medium', 'High'];
      const randomRisk = riskScores[Math.floor(Math.random() * riskScores.length)];
      
      const walletData = {
        address: walletAddress,
        risk: randomRisk,
        sanctioned: Math.random() > 0.7,
        fraudReports: Math.random() > 0.8,
        darkMarketExposure: Math.random() > 0.6,
        lastActivity: new Date().toLocaleDateString(),
        transactionCount: Math.floor(Math.random() * 1000) + 50
      };
      
      setCurrentWallet(walletData);
      setCurrentView('results');
    }
  };

  const recentChecks = [
    { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', risk: 'Low', time: '2 hours ago' },
    { address: '0x742C5F8A8FfC1b8B5Bb4b0B5e6C5D1A8F2C3D4E5', risk: 'High', time: '1 day ago' },
    { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', risk: 'Medium', time: '3 days ago' }
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      case 'Medium': return <AlertTriangle className="w-4 h-4" />;
      case 'High': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (currentView === 'results' && currentWallet) {
    return <WalletResults wallet={currentWallet} onBack={() => setCurrentView('dashboard')} onViewFlow={() => setCurrentView('flow')} onGenerateReport={() => setCurrentView('report')} />;
  }

  if (currentView === 'flow' && currentWallet) {
    return <TransactionFlow wallet={currentWallet} onBack={() => setCurrentView('results')} />;
  }

  if (currentView === 'report' && currentWallet) {
    return <ReportGenerator wallet={currentWallet} onBack={() => setCurrentView('results')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  BlockTrace
                </h1>
                <p className="text-sm text-slate-500">Crypto Wallet Risk Intelligence</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Reports</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">API</a>
              <Button variant="outline" size="sm">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Real-time Risk Assessment</span>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
            Crypto Wallet Risk Scoring
            <br />
            <span className="text-4xl">& Transaction Tracing</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12">
            Instantly assess wallet risk, trace transaction flows, and generate compliance reports. 
            Built for exchanges, fintechs, and compliance teams.
          </p>

          {/* Wallet Input */}
          <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Bitcoin or Ethereum wallet address..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="h-12 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    onKeyPress={(e) => e.key === 'Enter' && handleWalletCheck()}
                  />
                </div>
                <Button 
                  onClick={handleWalletCheck}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  disabled={!walletAddress.trim()}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Check Risk
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Get instant risk scores with plain-English explanations. Identify sanctioned addresses, fraud reports, and dark market exposure.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Transaction Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Visualize complex transaction networks with interactive graphs. Trace money flows and identify suspicious patterns.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Compliance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Generate professional PDF reports for audits, compliance, and client documentation with one click.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Checks */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Recent Wallet Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-slate-900">{check.address}</p>
                      <p className="text-xs text-slate-500">{check.time}</p>
                    </div>
                  </div>
                  <Badge className={`${getRiskColor(check.risk)} border font-medium`}>
                    {getRiskIcon(check.risk)}
                    <span className="ml-1">{check.risk} Risk</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">BlockTrace</span>
              </div>
              <p className="text-slate-400 text-sm">
                Professional crypto wallet risk assessment and transaction tracing for compliance teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Risk Assessment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Transaction Tracing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Disclaimer</h4>
              <p className="text-xs text-slate-400">
                This is a risk scoring and trace visualization tool, not a forensic product. 
                Risk assessments are based on available data sources and should not be considered definitive.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 BlockTrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
