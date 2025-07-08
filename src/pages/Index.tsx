
import React, { useState } from 'react';
import { Search, Shield, TrendingUp, FileText, Zap, CheckCircle, AlertTriangle, XCircle, ArrowRight, Sparkles } from 'lucide-react';
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
  const [isSearching, setIsSearching] = useState(false);

  const handleWalletCheck = async () => {
    if (walletAddress.trim()) {
      setIsSearching(true);
      
      // Simulate API call with loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      setIsSearching(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/20">
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
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                Reports
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                API
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-blue-200/50 hover:scale-105 transition-all duration-300 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Real-time Risk Assessment</span>
          </div>
          <h2 className="text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight">
            Crypto Wallet Risk Scoring
            <br />
            <span className="text-5xl">& Transaction Tracing</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Instantly assess wallet risk, trace transaction flows, and generate compliance reports. 
            Built for exchanges, fintechs, and compliance teams.
          </p>

          {/* Enhanced Wallet Input */}
          <Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter Bitcoin or Ethereum wallet address..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="h-14 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 pl-12"
                    onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleWalletCheck()}
                    disabled={isSearching}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <Button 
                  onClick={handleWalletCheck}
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={!walletAddress.trim() || isSearching}
                >
                  {isSearching ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Check Risk
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Shield,
              title: "Risk Assessment",
              description: "Get instant risk scores with plain-English explanations. Identify sanctioned addresses, fraud reports, and dark market exposure.",
              gradient: "from-green-500 to-emerald-600",
              delay: "0"
            },
            {
              icon: TrendingUp,
              title: "Transaction Flow",
              description: "Visualize complex transaction networks with interactive graphs. Trace money flows and identify suspicious patterns.",
              gradient: "from-blue-500 to-indigo-600",
              delay: "200"
            },
            {
              icon: FileText,
              title: "Compliance Reports",
              description: "Generate professional PDF reports for audits, compliance, and client documentation with one click.",
              gradient: "from-purple-500 to-pink-600",
              delay: "400"
            }
          ].map((feature, index) => (
            <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:-translate-y-2 animate-fade-in`} style={{ animationDelay: `${feature.delay}ms` }}>
              <CardHeader>
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
                <ArrowRight className="w-5 h-5 text-slate-400 mt-4 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Recent Checks */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
              Recent Wallet Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Shield className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{check.address}</p>
                      <p className="text-xs text-slate-500">{check.time}</p>
                    </div>
                  </div>
                  <Badge className={`${getRiskColor(check.risk)} border font-medium shadow-sm hover:shadow-md transition-shadow duration-300`}>
                    {getRiskIcon(check.risk)}
                    <span className="ml-2">{check.risk} Risk</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900/20 to-slate-900"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">BlockTrace</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Professional crypto wallet risk assessment and transaction tracing for compliance teams.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: ["Risk Assessment", "Transaction Tracing", "Compliance Reports"]
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Disclaimers"]
              },
              {
                title: "Disclaimer",
                content: "This is a risk scoring and trace visualization tool, not a forensic product. Risk assessments are based on available data sources and should not be considered definitive."
              }
            ].map((section, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                <h4 className="font-semibold mb-4 text-lg">{section.title}</h4>
                {section.links ? (
                  <ul className="space-y-3 text-sm text-slate-400">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href="#" className="hover:text-white transition-colors duration-300 hover:underline">{link}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {section.content}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 BlockTrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
