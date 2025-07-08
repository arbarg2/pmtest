
import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Eye, FileText, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const WalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }) => {
  const getRiskConfig = (risk) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          bgClass: 'from-green-50 to-emerald-50',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          description: 'This wallet shows minimal risk indicators and appears to engage in normal transaction patterns with reputable entities.'
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          bgClass: 'from-yellow-50 to-orange-50',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
          description: 'This wallet has some exposure to moderate risk factors. Enhanced due diligence may be warranted.'
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          bgClass: 'from-red-50 to-pink-50',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          description: 'This wallet has significant risk indicators including potential connections to sanctioned addresses or suspicious activity patterns.'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          bgClass: 'from-gray-50 to-slate-50',
          icon: <Shield className="w-8 h-8 text-gray-600" />,
          description: 'Risk assessment could not be completed.'
        };
    }
  };

  const riskConfig = getRiskConfig(wallet.risk);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass}`}>
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Wallet Risk Analysis</h1>
                <p className="text-sm text-slate-500">Comprehensive risk assessment results</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onViewFlow}>
                <Eye className="w-4 h-4 mr-2" />
                View Flow
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Wallet Address Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Wallet Address</h2>
              <Badge className="font-mono text-xs px-3 py-1 bg-slate-100 text-slate-700 border-slate-200">
                {wallet.address.length > 20 ? 'ETH' : 'BTC'}
              </Badge>
            </div>
            <p className="font-mono text-lg text-slate-800 bg-slate-50 p-4 rounded-lg break-all">
              {wallet.address}
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Risk Score */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {riskConfig.icon}
                  <span className="ml-3 text-2xl">Risk Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <Badge className={`${riskConfig.color} border-2 text-lg px-6 py-3 font-bold`}>
                    {wallet.risk.toUpperCase()} RISK
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Risk Score</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {wallet.risk === 'Low' ? '2.1' : wallet.risk === 'Medium' ? '6.8' : '9.2'}/10
                    </p>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed text-lg">
                  {riskConfig.description}
                </p>
              </CardContent>
            </Card>

            {/* Risk Flags */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Risk Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${wallet.sanctioned ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="font-medium">Sanctioned Entity</span>
                    </div>
                    <Badge variant={wallet.sanctioned ? 'destructive' : 'default'} className="font-medium">
                      {wallet.sanctioned ? 'FLAGGED' : 'CLEAR'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${wallet.fraudReports ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="font-medium">Fraud Reports</span>
                    </div>
                    <Badge variant={wallet.fraudReports ? 'destructive' : 'default'} className="font-medium">
                      {wallet.fraudReports ? 'DETECTED' : 'NONE'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${wallet.darkMarketExposure ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="font-medium">Dark Market Exposure</span>
                    </div>
                    <Badge variant={wallet.darkMarketExposure ? 'destructive' : 'default'} className="font-medium">
                      {wallet.darkMarketExposure ? 'DETECTED' : 'CLEAR'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Stats */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Wallet Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Total Transactions</span>
                  </div>
                  <span className="font-bold text-slate-900">{wallet.transactionCount.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Last Activity</span>
                  </div>
                  <span className="font-bold text-slate-900">{wallet.lastActivity}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Assessment Date</span>
                  </div>
                  <span className="font-bold text-slate-900">Today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={onViewFlow} variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Transaction Flow
                </Button>
                <Button onClick={onGenerateReport} className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF Report
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
