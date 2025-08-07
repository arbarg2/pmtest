import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, AlertTriangle, Scale, FileText, User, Clock, ChevronDown } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface RegulatorJustificationProps {
  wallet: WalletRiskResponse;
  recordId?: string;
  caseId?: string;
  aiSummary?: string;
  onDownloadReport: () => void;
}

const RegulatorJustification = ({ 
  wallet, 
  recordId, 
  caseId, 
  aiSummary,
  onDownloadReport 
}: RegulatorJustificationProps) => {
  const { user } = useAuth();
  const [manualJustification, setManualJustification] = useState('');
  const [isAuditExpanded, setIsAuditExpanded] = useState(true);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

  // Generate compliance signals
  const complianceSignals = [
    {
      label: 'Sanctions Screening',
      status: wallet.risk_factors?.sanctioned?.present ? 'warning' : 'complete',
      icon: wallet.risk_factors?.sanctioned?.present ? AlertTriangle : CheckCircle,
      description: wallet.risk_factors?.sanctioned?.present ? 'Sanctions exposure detected' : 'No sanctions matches found'
    },
    {
      label: 'Darknet Exposure',
      status: wallet.risk_factors?.dark_market_exposure?.present ? 'blocked' : 'complete',
      icon: wallet.risk_factors?.dark_market_exposure?.present ? XCircle : CheckCircle,
      description: wallet.risk_factors?.dark_market_exposure?.present ? 'Dark market connections identified' : 'No darknet exposure detected'
    },
    {
      label: 'Mixer Interaction',
      status: wallet.risk_factors?.mixer_usage ? 'warning' : 'complete',
      icon: wallet.risk_factors?.mixer_usage ? AlertTriangle : CheckCircle,
      description: wallet.risk_factors?.mixer_usage ? 'Mixer usage flagged' : 'No mixer interactions detected'
    },
    {
      label: 'Geographic Risk',
      status: wallet.geographic_risk?.geo_risk_score && wallet.geographic_risk.geo_risk_score > 5 ? 'warning' : 'complete',
      icon: wallet.geographic_risk?.geo_risk_score && wallet.geographic_risk.geo_risk_score > 5 ? AlertTriangle : CheckCircle,
      description: wallet.geographic_risk?.geo_risk_score && wallet.geographic_risk.geo_risk_score > 5 ? 'High-risk jurisdiction exposure' : 'Standard jurisdiction profile'
    }
  ];

  // Confidence checklist items
  const confidenceChecklist = [
    {
      label: 'Sanctions screening complete',
      completed: true,
      critical: true
    },
    {
      label: 'Mixer interaction analysis',
      completed: true,
      critical: false
    },
    {
      label: 'Entity attribution assessment',
      completed: !!wallet.entity_attribution?.confidence,
      critical: false,
      detail: wallet.entity_attribution?.confidence 
        ? `${Math.round(wallet.entity_attribution.confidence * 100)}% confidence`
        : 'Pending analysis'
    },
    {
      label: 'Analyst summary review',
      completed: !!manualJustification,
      critical: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'blocked': return XCircle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Justification Main Card */}
      <Collapsible open={isAuditExpanded} onOpenChange={setIsAuditExpanded}>
        <Card className="border-blue-200 bg-blue-50/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-blue-900">Audit Justification</span>
                    <div className="text-xs text-blue-600 font-normal mt-1">
                      Generated for regulatory compliance and audit trail
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${isAuditExpanded ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Analyst & Timing Information */}
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">Analyst</div>
                    <div className="font-medium">{user?.email || 'Current User'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">Analysis Time</div>
                    <div className="font-medium">{new Date().toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">Record ID</div>
                    <div className="font-medium font-mono text-sm">{recordId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* AI Risk Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">AI-Generated Risk Assessment</h4>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={wallet.risk_level === 'High' ? 'destructive' : 
                                   wallet.risk_level === 'Medium' ? 'secondary' : 'outline'}>
                      {wallet.risk_level} Risk ({wallet.risk_score}/10)
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Generated: {new Date().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {aiSummary || `This ${wallet.network} wallet demonstrates ${wallet.risk_level.toLowerCase()} risk characteristics with a computed risk score of ${wallet.risk_score}/10. Analysis includes comprehensive sanctions screening, entity attribution assessment, and behavioral pattern recognition across ${wallet.transaction_count || 0} transactions.`}
                  </p>
                </div>
              </div>

              {/* Compliance Signals */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Key Compliance Signals</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {complianceSignals.map((signal, index) => {
                    const Icon = signal.icon;
                    return (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(signal.status)}`}>
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-sm">{signal.label}</div>
                            <div className="text-xs opacity-75">{signal.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Justification */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Analyst Justification Note</h4>
                <Textarea
                  placeholder="Add your professional justification for this risk assessment decision. This will be included in regulatory reports and audit documentation..."
                  value={manualJustification}
                  onChange={(e) => setManualJustification(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="text-xs text-gray-500">
                  This note will be included in all regulatory reports and serves as your professional justification for compliance decisions.
                </div>
              </div>

              {/* Download Report Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={onDownloadReport} className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Regulator Report (PDF)
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Regulator Confidence Checklist */}
      <Collapsible open={isChecklistExpanded} onOpenChange={setIsChecklistExpanded}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Regulator Confidence Checklist</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isChecklistExpanded ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {confidenceChecklist.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <span className={`text-sm ${item.completed ? 'text-gray-900' : 'text-red-700 font-medium'}`}>
                        {item.label}
                        {item.critical && !item.completed && (
                          <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">Required</span>
                        )}
                      </span>
                      {item.detail && (
                        <div className="text-xs text-gray-500 mt-1">{item.detail}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.completed ? 'outline' : 'destructive'}>
                    {item.completed ? 'Complete' : 'Pending'}
                  </Badge>
                </div>
              ))}
              
              {caseId && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">
                    Associated Case ID: {caseId}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    This analysis is linked to formal case investigation for enhanced audit trail
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default RegulatorJustification;
