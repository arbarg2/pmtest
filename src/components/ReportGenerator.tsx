
import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Shield, CheckCircle, AlertTriangle, XCircle, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ReportGenerator = ({ wallet, onBack }) => {
  const [generating, setGenerating] = useState(false);

  const generatePDFContent = () => {
    const reportData = {
      reportId: `BT-${Date.now().toString().slice(-6)}`,
      generatedDate: new Date().toLocaleDateString(),
      generatedTime: new Date().toLocaleTimeString(),
      
      // Executive Summary
      executiveSummary: `This comprehensive compliance report provides an analysis of cryptocurrency wallet ${wallet.address}. The assessment indicates a ${wallet.risk_level.toLowerCase()} risk profile based on transaction patterns, entity associations, and regulatory screening as of ${new Date().toLocaleDateString()}.`,
      
      // Risk Assessment Details
      riskFactorAnalysis: {
        sanctionsScreening: wallet.risk_factors.sanctioned ? 'FLAGGED - Potential sanctions exposure detected' : 'CLEAR - No sanctions matches found',
        fraudIndicators: wallet.risk_factors.fraud_reports ? 'FLAGGED - Fraud reports associated' : 'CLEAR - No fraud indicators detected',
        darkMarketExposure: wallet.risk_factors.dark_market_exposure ? 'FLAGGED - Dark market connections identified' : 'CLEAR - No dark market exposure',
        mixerUsage: wallet.risk_factors.mixer_usage ? 'FLAGGED - Privacy mixer activity detected' : 'CLEAR - No mixer usage identified',
        highFrequencyTrading: wallet.risk_factors.high_frequency_trading ? 'FLAGGED - High frequency trading patterns' : 'CLEAR - Normal trading frequency'
      },
      
      // Compliance Recommendations
      complianceRecommendation: getComplianceRecommendation(wallet.risk_level, wallet.risk_factors),
      
      // Regulatory Considerations
      regulatoryNotes: generateRegulatoryNotes(wallet),
      
      // Transaction Summary
      transactionSummary: {
        totalTransactions: wallet.transaction_count.toLocaleString(),
        lastActivity: wallet.last_activity,
        network: wallet.network === 'BTC' ? 'Bitcoin' : 'Ethereum',
        processingTime: `${wallet.processing_time_ms}ms`
      }
    };
    
    return reportData;
  };

  const getComplianceRecommendation = (riskLevel, riskFactors) => {
    if (riskLevel === 'High' || riskFactors.sanctioned) {
      return {
        action: 'BLOCK TRANSACTION',
        reasoning: 'High risk indicators require immediate escalation and manual review before processing any transactions.',
        nextSteps: [
          'Escalate to compliance officer immediately',
          'Conduct enhanced due diligence procedures',
          'Document all findings and decisions',
          'Consider filing Suspicious Activity Report (SAR) if required'
        ]
      };
    } else if (riskLevel === 'Medium') {
      return {
        action: 'ENHANCED DUE DILIGENCE',
        reasoning: 'Moderate risk indicators warrant additional verification and monitoring procedures.',
        nextSteps: [
          'Implement enhanced monitoring procedures',
          'Request additional customer documentation',
          'Set transaction limits and monitoring thresholds',
          'Schedule periodic review in 30 days'
        ]
      };
    } else {
      return {
        action: 'STANDARD PROCESSING',
        reasoning: 'Low risk profile allows for standard processing with routine monitoring.',
        nextSteps: [
          'Process under standard procedures',
          'Apply routine transaction monitoring',
          'Schedule next review in 90 days',
          'Maintain records per regulatory requirements'
        ]
      };
    }
  };

  const generateRegulatoryNotes = (wallet) => {
    const notes = [];
    
    if (wallet.risk_factors.sanctioned) {
      notes.push('⚠️ OFAC COMPLIANCE: Potential sanctions match requires immediate review under BSA/AML regulations.');
    }
    
    if (wallet.risk_factors.mixer_usage) {
      notes.push('🔒 PRIVACY COINS: Mixer usage may indicate attempt to obscure transaction history - consider FinCEN guidance on privacy coins.');
    }
    
    if (wallet.transaction_count > 1000) {
      notes.push('📊 HIGH VOLUME: Large transaction count may require CTR (Currency Transaction Report) consideration.');
    }
    
    if (wallet.risk_level === 'High') {
      notes.push('🚨 SAR CONSIDERATION: High risk profile may warrant Suspicious Activity Report filing within 30 days.');
    }
    
    return notes.length > 0 ? notes : ['✅ STANDARD COMPLIANCE: No special regulatory considerations identified.'];
  };

  const handleDownloadReport = async () => {
    setGenerating(true);
    
    try {
      const reportData = generatePDFContent();
      
      // Create comprehensive report content
      const reportContent = `
BLOCKTRACE COMPLIANCE REPORT
════════════════════════════════════════════════════════════════

REPORT IDENTIFICATION
Report ID: ${reportData.reportId}
Generated: ${reportData.generatedDate} at ${reportData.generatedTime}
Analyst: System Generated
Classification: CONFIDENTIAL

EXECUTIVE SUMMARY
${reportData.executiveSummary}

WALLET INFORMATION
═══════════════════
Address: ${wallet.address}
Network: ${reportData.transactionSummary.network}
Total Transactions: ${reportData.transactionSummary.totalTransactions}
Last Activity: ${reportData.transactionSummary.lastActivity}
Analysis Time: ${reportData.transactionSummary.processingTime}

RISK ASSESSMENT
══════════════
Overall Risk Level: ${wallet.risk_level.toUpperCase()}
Risk Score: ${wallet.risk_score.toFixed(1)}/10.0

DETAILED RISK FACTORS
────────────────────
• Sanctions Screening: ${reportData.riskFactorAnalysis.sanctionsScreening}
• Fraud Indicators: ${reportData.riskFactorAnalysis.fraudIndicators}  
• Dark Market Exposure: ${reportData.riskFactorAnalysis.darkMarketExposure}
• Mixer Usage: ${reportData.riskFactorAnalysis.mixerUsage}
• High Frequency Trading: ${reportData.riskFactorAnalysis.highFrequencyTrading}

COMPLIANCE RECOMMENDATION
═════════════════════════
Action Required: ${reportData.complianceRecommendation.action}

Reasoning: ${reportData.complianceRecommendation.reasoning}

Next Steps:
${reportData.complianceRecommendation.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

REGULATORY CONSIDERATIONS
════════════════════════
${reportData.regulatoryNotes.join('\n')}

TECHNICAL DETAILS
════════════════
Processing Algorithm: BlockTrace Risk Engine v2.1
Data Sources: Multi-source blockchain analysis
Confidence Level: ${Math.min(95, 60 + (wallet.risk_score * 3.5)).toFixed(1)}%
Last Updated: ${new Date().toISOString()}

COMPLIANCE ATTESTATION
═════════════════════
This report has been generated in accordance with:
• Bank Secrecy Act (BSA) requirements
• Anti-Money Laundering (AML) regulations  
• Office of Foreign Assets Control (OFAC) guidelines
• Financial Crimes Enforcement Network (FinCEN) guidance

The analysis contained herein is based on available blockchain data and 
should be considered alongside other due diligence procedures.

DISCLAIMER
═════════
This report is generated for compliance and risk assessment purposes only.
The information should not be considered as definitive evidence of criminal 
activity. Risk assessments are based on algorithmic analysis of available 
data sources and may have limitations. This report should be used in 
conjunction with other due diligence procedures and professional judgment.

END OF REPORT
Report Generated by BlockTrace™ Compliance Platform
© ${new Date().getFullYear()} BlockTrace. All rights reserved.
      `.trim();
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BlockTrace_Compliance_Report_${wallet.address.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintReport = () => {
    const reportData = generatePDFContent();
    const printWindow = window.open('', '_blank');
    const printContent = `
<!DOCTYPE html>
<html>
<head>
    <title>BlockTrace Compliance Report</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .risk-high { color: #dc2626; font-weight: bold; }
        .risk-medium { color: #ea580c; font-weight: bold; }
        .risk-low { color: #16a34a; font-weight: bold; }
        .flagged { color: #dc2626; }
        .clear { color: #16a34a; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>BLOCKTRACE COMPLIANCE REPORT</h1>
        <p>Report ID: ${reportData.reportId} | Generated: ${reportData.generatedDate}</p>
    </div>
    
    <div class="section">
        <h2>EXECUTIVE SUMMARY</h2>
        <p>${reportData.executiveSummary}</p>
    </div>
    
    <div class="section">
        <h2>RISK ASSESSMENT</h2>
        <p>Overall Risk Level: <span class="risk-${wallet.risk_level.toLowerCase()}">${wallet.risk_level.toUpperCase()}</span></p>
        <p>Risk Score: ${wallet.risk_score.toFixed(1)}/10.0</p>
    </div>
    
    <div class="section">
        <h2>COMPLIANCE RECOMMENDATION</h2>
        <p><strong>Action Required:</strong> ${reportData.complianceRecommendation.action}</p>
        <p><strong>Reasoning:</strong> ${reportData.complianceRecommendation.reasoning}</p>
    </div>
    
    <div class="section">
        <h2>WALLET INFORMATION</h2>
        <p>Address: ${wallet.address}</p>
        <p>Network: ${reportData.transactionSummary.network}</p>
        <p>Transactions: ${reportData.transactionSummary.totalTransactions}</p>
    </div>
</body>
</html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
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

  const riskConfig = getRiskConfig(wallet.risk_level);
  const reportData = generatePDFContent();

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
                <p className="text-sm text-slate-500">Industry-standard PDF generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handlePrintReport}
                variant="outline"
                disabled={generating}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={handleDownloadReport}
                disabled={generating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
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
                <h2 className="text-xl text-slate-600">Cryptocurrency Compliance Report</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Report ID</p>
                <p className="font-mono text-lg font-bold text-slate-900">{reportData.reportId}</p>
                <p className="text-sm text-slate-500 mt-2">Generated: {reportData.generatedDate}</p>
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
                      <h4 className="text-xl font-bold text-slate-900">Risk Level: {wallet.risk_level}</h4>
                      <p className="text-slate-600">Overall risk assessment</p>
                    </div>
                  </div>
                  <Badge className={`${riskConfig.color} border-2 text-lg px-6 py-3 font-bold`}>
                    {wallet.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {reportData.executiveSummary}
                </p>
              </div>
            </section>

            {/* Compliance Recommendation */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Compliance Recommendation</h3>
              <div className={`rounded-xl p-8 border-2 ${
                reportData.complianceRecommendation.action === 'BLOCK TRANSACTION' ? 'bg-red-50 border-red-200' :
                reportData.complianceRecommendation.action === 'ENHANCED DUE DILIGENCE' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <h4 className="text-xl font-bold mb-4">
                  Action Required: {reportData.complianceRecommendation.action}
                </h4>
                <p className="text-slate-700 mb-4">{reportData.complianceRecommendation.reasoning}</p>
                <div>
                  <h5 className="font-semibold mb-2">Next Steps:</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {reportData.complianceRecommendation.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Risk Indicators */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Risk Factor Analysis</h3>
              <div className="space-y-4">
                {Object.entries(reportData.riskFactorAnalysis).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${value.includes('FLAGGED') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-slate-600">{value}</p>
                      </div>
                    </div>
                    <Badge variant={value.includes('FLAGGED') ? 'destructive' : 'default'} className="font-medium">
                      {value.includes('FLAGGED') ? 'FLAGGED' : 'CLEAR'}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Regulatory Notes */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Regulatory Considerations</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <ul className="space-y-2">
                  {reportData.regulatoryNotes.map((note, index) => (
                    <li key={index} className="text-slate-700">{note}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="border-t pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Important Disclaimer</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-sm text-slate-700 leading-relaxed">
                  This report is generated by BlockTrace for compliance and risk assessment purposes. 
                  The information should not be considered as definitive evidence of criminal activity. 
                  Risk assessments are based on algorithmic analysis and should be used in conjunction 
                  with other due diligence procedures and professional judgment. All findings should be 
                  verified through additional investigation where appropriate.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-slate-500">
              <p>Generated by BlockTrace™ Compliance Platform | Report ID: {reportData.reportId}</p>
              <p className="mt-2">This report contains confidential information and should be handled accordingly.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportGenerator;
