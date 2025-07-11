
import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Eye, FileText, Calendar, Hash, TrendingUp, Activity, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIExplainer } from '@/components/AIExplainer';
import { WalletRiskResponse } from '@/services/api';

interface WalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

const WalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }: WalletResultsProps) => {
  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          bgClass: 'from-green-50 to-emerald-50',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          description: 'This wallet shows minimal risk indicators and appears to engage in normal transaction patterns with reputable entities.',
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          bgClass: 'from-yellow-50 to-orange-50',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
          description: 'This wallet has some exposure to moderate risk factors. Enhanced due diligence may be warranted.',
          gradient: 'from-yellow-500 to-orange-600'
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          bgClass: 'from-red-50 to-pink-50',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          description: 'This wallet has significant risk indicators including potential connections to sanctioned addresses or suspicious activity patterns.',
          gradient: 'from-red-500 to-pink-600'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          bgClass: 'from-gray-50 to-slate-50',
          icon: <Shield className="w-8 h-8 text-gray-600" />,
          description: 'Risk assessment could not be completed.',
          gradient: 'from-gray-500 to-slate-600'
        };
    }
  };

  const riskConfig = getRiskConfig(wallet.risk_level);

  const riskIndicators = [
    {
      label: 'Sanctioned Entity',
      value: wallet.risk_factors.sanctioned,
      description: 'Check against OFAC and international sanctions lists'
    },
    {
      label: 'Fraud Reports',
      value: wallet.risk_factors.fraud_reports,
      description: 'Known fraud or scam associations'
    },
    {
      label: 'Dark Market Exposure',
      value: wallet.risk_factors.dark_market_exposure,
      description: 'Connections to known illicit marketplaces'
    },
    {
      label: 'Mixer Usage',
      value: wallet.risk_factors.mixer_usage,
      description: 'Usage of cryptocurrency mixers or privacy tools'
    },
    {
      label: 'High-Frequency Trading',
      value: wallet.risk_factors.high_frequency_trading,
      description: 'Unusual transaction frequency patterns'
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-fade-in">
              <Button variant="ghost" onClick={onBack} className="p-2 hover:scale-110 transition-transform duration-200">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Rìan Risk Analysis</h1>
                <p className="text-sm text-slate-500">
                  Analyzed in {wallet.processing_time_ms}ms • {wallet.network} Network
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Button variant="outline" onClick={onViewFlow} className="hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
                <Eye className="w-4 h-4 mr-2" />
                View Flow
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Wallet Address Card */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-fade-in hover:shadow-3xl transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                Target Wallet Address
              </h2>
              <div className="flex items-center space-x-2">
                <Badge className="font-mono text-xs px-4 py-2 bg-slate-100 text-slate-700 border-slate-200 shadow-sm">
                  {wallet.network}
                </Badge>
                <Badge className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  {wallet.processing_time_ms}ms
                </Badge>
              </div>
            </div>
            <div className="relative group">
              <p className="font-mono text-lg text-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-2xl break-all border border-slate-200 shadow-inner">
                {wallet.address}
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Risk Score */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-slide-up hover:shadow-3xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {riskConfig.icon}
                    <span className="ml-4 text-2xl">Risk Assessment</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Risk Score</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-4xl font-bold text-slate-900">{wallet.risk_score.toFixed(1)}</span>
                      <span className="text-lg text-slate-500">/10</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Badge className={`${riskConfig.color} border-2 text-xl px-8 py-4 font-bold shadow-lg animate-glow`}>
                    {wallet.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
                <p className="text-slate-700 leading-relaxed text-lg mb-6">
                  {riskConfig.description}
                </p>
                
                {/* Risk Score Visualization */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-700">Risk Breakdown</span>
                    <Activity className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Transaction Pattern', score: wallet.risk_level === 'High' ? 85 : wallet.risk_level === 'Medium' ? 45 : 15 },
                      { label: 'Entity Association', score: wallet.risk_level === 'High' ? 92 : wallet.risk_level === 'Medium' ? 68 : 25 },
                      { label: 'Volume Analysis', score: wallet.risk_level === 'High' ? 78 : wallet.risk_level === 'Medium' ? 52 : 12 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-medium">{item.score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${riskConfig.gradient} transition-all duration-1000 ease-out`}
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Explainer */}
            <AIExplainer walletData={wallet} />

            {/* Risk Flags */}
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-slide-up hover:shadow-3xl transition-all duration-500" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                  Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-all duration-300 group hover:scale-[1.02] border border-slate-100 hover:border-slate-200 hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full transition-all duration-300 ${indicator.value ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-green-500 shadow-lg shadow-green-500/30'}`}></div>
                        <div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{indicator.label}</span>
                          <p className="text-sm text-slate-500">{indicator.description}</p>
                        </div>
                      </div>
                      <Badge variant={indicator.value ? 'destructive' : 'default'} className="font-medium shadow-sm hover:shadow-md transition-shadow duration-300">
                        {indicator.value ? 'FLAGGED' : 'CLEAR'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Stats */}
          <div className="space-y-6">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-fade-in hover:shadow-3xl transition-all duration-500" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Hash className="w-5 h-5 mr-2 text-blue-600" />
                  Wallet Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { icon: Hash, label: 'Total Transactions', value: wallet.transaction_count.toLocaleString() },
                  { icon: Calendar, label: 'Last Activity', value: wallet.last_activity },
                  { icon: Shield, label: 'Network', value: wallet.network },
                  { icon: Activity, label: 'Processing Time', value: `${wallet.processing_time_ms}ms` }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-300 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-600">{stat.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-fade-in hover:shadow-3xl transition-all duration-500" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">Investigation Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={onViewFlow} variant="outline" className="w-full justify-start hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Eye className="w-4 h-4 mr-2" />
                  View Transaction Flow
                </Button>
                <Button onClick={onGenerateReport} className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Investigation Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletResults;
