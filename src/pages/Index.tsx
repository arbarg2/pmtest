
import React, { useState } from 'react';
import { Search, Shield, TrendingUp, FileText, Zap, CheckCircle, AlertTriangle, XCircle, ArrowRight, Sparkles, DollarSign, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import WalletResults from '@/components/WalletResults';
import TransactionFlow from '@/components/TransactionFlow';
import ReportGenerator from '@/components/ReportGenerator';
import { QuickStartDemo } from '@/components/QuickStartDemo';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const { isAnalyzing, analysisData, analyzeWallet, generateReport } = useWalletAnalysis();

  const handleWalletCheck = async () => {
    if (walletAddress.trim()) {
      const result = await analyzeWallet(walletAddress);
      if (result) {
        setCurrentView('results');
      }
    }
  };

  const handleDemoTry = async (address: string) => {
    setWalletAddress(address);
    const result = await analyzeWallet(address);
    if (result) {
      setCurrentView('results');
    }
  };

  if (currentView === 'results' && analysisData) {
    return <WalletResults wallet={analysisData} onBack={() => setCurrentView('dashboard')} onViewFlow={() => setCurrentView('flow')} onGenerateReport={() => setCurrentView('report')} />;
  }

  if (currentView === 'flow' && analysisData) {
    return <TransactionFlow wallet={analysisData} onBack={() => setCurrentView('results')} />;
  }

  if (currentView === 'report' && analysisData) {
    return <ReportGenerator wallet={analysisData} onBack={() => setCurrentView('results')} />;
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
                  Rian
                </h1>
                <p className="text-sm text-slate-500">Lightweight Crypto Risk Intelligence</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                API
                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">API-First</Badge>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors relative group">
                Docs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">Free Trial</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-blue-200/50 hover:scale-105 transition-all duration-300 shadow-sm">
            <Zap className="w-4 h-4" />
            <span>Lightweight • Cost-Efficient • API-First</span>
          </div>
          <h2 className="text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight">
            Wallet Risk Scoring
            <br />
            <span className="text-4xl">Made Simple & Affordable</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Real-time risk analysis for Bitcoin & Ethereum. API-first design, transparent pricing, 
            and results in under 1 second. Built for teams priced out of enterprise solutions.
          </p>

          {/* Value Props */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Clock, label: "< 1 Second", desc: "Real-time analysis" },
              { icon: DollarSign, label: "From $99/mo", desc: "Transparent pricing" },
              { icon: Zap, label: "API-First", desc: "Easy integration" },
              { icon: Users, label: "No Lock-in", desc: "Use our UI or yours" }
            ].map((item, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 hover:shadow-lg transition-all duration-300">
                <item.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Enhanced Wallet Input */}
          <Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter Bitcoin or Ethereum wallet address..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="h-14 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 pl-12"
                    onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleWalletCheck()}
                    disabled={isAnalyzing}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <Button 
                  onClick={handleWalletCheck}
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={!walletAddress.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
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

          {/* Quick Start Demo */}
          <QuickStartDemo onTryDemo={handleDemoTry} />
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Shield,
              title: "Lightweight Analysis",
              description: "1-3 hop transaction tracing, real-time scoring, and AI-powered risk detection. Fast results without the enterprise complexity.",
              gradient: "from-green-500 to-emerald-600",
              delay: "0",
              badge: "< 1 sec"
            },
            {
              icon: TrendingUp,
              title: "Cost-Efficient Data",
              description: "Built on public blockchain data with selective premium enrichment. 80% less expensive than traditional solutions.",
              gradient: "from-blue-500 to-indigo-600",
              delay: "200",
              badge: "80% Cheaper"
            },
            {
              icon: FileText,
              title: "API-First Design",
              description: "RESTful API with auto-generated SDKs. Use our dashboard or integrate into your existing systems in minutes.",
              gradient: "from-purple-500 to-pink-600",
              delay: "400",
              badge: "Easy Integration"
            }
          ].map((feature, index) => (
            <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:-translate-y-2 animate-fade-in`} style={{ animationDelay: `${feature.delay}ms` }}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 text-xs">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Preview */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-2xl">
              <DollarSign className="w-6 h-6 mr-3 text-green-600" />
              Simple, Transparent Pricing
            </CardTitle>
            <p className="text-slate-600">No hidden fees. No enterprise sales calls. Start free.</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Free", price: "$0", checks: "100 checks/month", features: ["Basic risk scoring", "Public API access", "Community support"] },
                { name: "Pro", price: "$99", checks: "10,000 checks/month", features: ["Advanced risk factors", "Transaction graphs", "Priority support", "Custom reports"] },
                { name: "Enterprise", price: "Custom", checks: "Unlimited", features: ["White-label option", "Custom data sources", "SLA guarantee", "Dedicated support"] }
              ].map((plan, index) => (
                <div key={index} className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${index === 1 ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-3xl font-bold text-blue-600 my-2">{plan.price}</p>
                    <p className="text-sm text-slate-500 mb-4">{plan.checks}</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                Start Free Trial
              </Button>
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
                <span className="text-2xl font-bold">Rian</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Lightweight, cost-efficient crypto wallet risk intelligence. API-first design for modern compliance teams.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: ["API Documentation", "Pricing", "Integration Guide", "Status Page"]
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"]
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Data Processing", "Compliance"]
              }
            ].map((section, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                <h4 className="font-semibold mb-4 text-lg">{section.title}</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="hover:text-white transition-colors duration-300 hover:underline">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 Rian. Built for compliance teams who need speed, accuracy, and affordability.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
