
import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ReportGenerator = ({ wallet, onBack }) => {
  const [generating, setGenerating] = useState(false);

  const handleDownloadReport = () => {
    setGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      // In a real app, this would generate and download a PDF
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,BlockTrace Compliance Report - Generated for demonstration purposes';
      link.download = `BlockTrace_Report_${wallet.address.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
    }, 2000);
  };

  const getRiskConfig = (risk) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: <XCircle className="w-6 h-6 text-red-600" />,
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: <Shield className="w-6 h-6 text-gray-600" />,
        };
    }
  };

  const riskConfig = getRiskConfig(wallet.risk);
  const reportId = `BT-${Date.now().toString().slice(-6)}`;

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
                <h1 className="text-xl font-bold text-slate-900">Compliance Report</h1>
                <p className="text-sm text-slate-500">Professional PDF generation</p>
              </div>
            </div>
            <Button 
              onClick={handleDownloadReport}
              disabled={generating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Report Preview */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardContent className="p-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-12 pb-8 border-b">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">BlockTrace</h1>
                </div>
                <h2 className="text-xl text-slate-600">Crypto Wallet Risk Assessment Report</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Report ID</p>
                <p className="font-mono text-lg font-bold text-slate-900">{reportId}</p>
                <p className="text-sm text-slate-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Executive Summary</h3>
              <div className="bg-slate-50 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {riskConfig.icon}
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Risk Level: {wallet.risk}</h4>
                      <p className="text-slate-600">Overall risk assessment</p>
                    </div>
                  </div>
                  <Badge className={`${riskConfig.color} border-2 text-lg px-6 py-3 font-bold`}>
                    {wallet.risk.toUpperCase()} RISK
                  </Badge>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  This report provides a comprehensive risk analysis of the specified cryptocurrency wallet address. 
                  The assessment is based on transaction patterns, entity associations, and known risk indicators 
                  as of the report generation date.
                </p>
              </div>
            </section>

            {/* Wallet Information */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Wallet Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Address</h4>
                  <p className="font-mono text-sm bg-slate-100 p-3 rounded-lg break-all">{wallet.address}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Network</h4>
                  <p className="text-slate-700">{wallet.address.length > 20 ? 'Ethereum' : 'Bitcoin'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Total Transactions</h4>
                  <p className="text-slate-700">{wallet.transactionCount.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Last Activity</h4>
                  <p className="text-slate-700">{wallet.lastActivity}</p>
                </div>
              </div>
            </section>

            {/* Risk Indicators */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Risk Indicators</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${wallet.sanctioned ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Sanctioned Entity</h4>
                      <p className="text-sm text-slate-600">Check against known sanctions lists</p>
                    </div>
                  </div>
                  <Badge variant={wallet.sanctioned ? 'destructive' : 'default'} className="font-medium">
                    {wallet.sanctioned ? 'FLAGGED' : 'CLEAR'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${wallet.fraudReports ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Fraud Reports</h4>
                      <p className="text-sm text-slate-600">Known fraud or scam associations</p>
                    </div>
                  </div>
                  <Badge variant={wallet.fraudReports ? 'destructive' : 'default'} className="font-medium">
                    {wallet.fraudReports ? 'DETECTED' : 'NONE'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${wallet.darkMarketExposure ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Dark Market Exposure</h4>
                      <p className="text-sm text-slate-600">Connections to known illicit marketplaces</p>
                    </div>
                  </div>
                  <Badge variant={wallet.darkMarketExposure ? 'destructive' : 'default'} className="font-medium">
                    {wallet.darkMarketExposure ? 'DETECTED' : 'CLEAR'}
                  </Badge>
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="border-t pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Important Disclaimer</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-sm text-slate-700 leading-relaxed">
                  This report is generated by BlockTrace, a risk scoring and transaction visualization tool. 
                  The information provided should not be considered as definitive evidence of criminal activity 
                  or regulatory compliance. Risk assessments are based on available data sources and algorithmic 
                  analysis, which may have limitations. This report is intended for informational purposes and 
                  should be used in conjunction with other due diligence procedures.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-slate-500">
              <p>Generated by BlockTrace | Report ID: {reportId} | {new Date().toLocaleDateString()}</p>
              <p className="mt-2">This report contains confidential information and should be handled accordingly.</p>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Download</h3>
            <p className="text-slate-600 mb-6">
              Your compliance report is ready for download. The PDF will include all risk indicators, 
              wallet information, and transaction analysis data.
            </p>
            <Button 
              onClick={handleDownloadReport}
              disabled={generating}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3"
            >
              <Download className="w-5 h-5 mr-2" />
              {generating ? 'Generating PDF...' : 'Download Compliance Report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportGenerator;
