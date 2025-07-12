import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Edit3, Tag, Clock, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LookupRecord } from '@/types/lookupRecords';
import { useLookupRecords } from '@/hooks/useLookupRecords';

export function LookupRecordsTable() {
  const { records, stats, isLoading, updateRecord } = useLookupRecords();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<LookupRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    case_notes: '',
    analyst_decision: 'pending' as LookupRecord['analyst_fields']['analyst_decision'],
    tags: [] as string[],
  });

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'High': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Critical': return <Shield className="w-4 h-4 text-red-700" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Critical': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'cleared': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditRecord = (record: LookupRecord) => {
    setEditingRecord(record.id);
    setEditForm({
      case_notes: record.analyst_fields.case_notes,
      analyst_decision: record.analyst_fields.analyst_decision,
      tags: record.analyst_fields.tags,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    await updateRecord(editingRecord, editForm);
    setEditingRecord(null);
  };

  const handleViewDetails = (record: LookupRecord) => {
    console.log('Viewing details for record:', record.id);
    setSelectedRecord(record);
  };

  const handleBackToRecords = () => {
    setSelectedRecord(null);
    setEditingRecord(null);
  };

  const filteredRecords = records.filter(record =>
    record.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.analyst_fields.case_notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.compliance_summary.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBackToRecords}>
            ← Back to Records
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Record
            </Button>
            <Button size="sm" onClick={() => handleEditRecord(selectedRecord)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Record
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getRiskIcon(selectedRecord.risk_assessment.risk_level)}
                <span>Record Details: {selectedRecord.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getRiskColor(selectedRecord.risk_assessment.risk_level)}>
                  {selectedRecord.risk_assessment.risk_level} Risk
                </Badge>
                <Badge className={getDecisionColor(selectedRecord.analyst_fields.analyst_decision)}>
                  {selectedRecord.analyst_fields.analyst_decision.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Wallet Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Address:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedRecord.wallet_address}</code></div>
                  <div><strong>Network:</strong> {selectedRecord.network}</div>
                  <div><strong>Risk Score:</strong> {selectedRecord.risk_assessment.risk_score.toFixed(1)}/10</div>
                  <div><strong>Analyzed:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Flow Analysis */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Flow Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Total Inbound:</strong> ${selectedRecord.risk_assessment.flow_analysis.total_inbound.toFixed(2)}</div>
                  <div><strong>Total Outbound:</strong> ${selectedRecord.risk_assessment.flow_analysis.total_outbound.toFixed(2)}</div>
                  <div><strong>Net Flow:</strong> ${selectedRecord.risk_assessment.flow_analysis.net_flow.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Risk Factors</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRecord.risk_assessment.key_risk_factors.map((factor, index) => (
                  <Badge key={index} variant="outline" className="text-red-700 border-red-200 bg-red-50">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Compliance Summary */}
            <div>
              <h3 className="font-semibold text-lg mb-3">AI Compliance Assessment</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm mb-3">{selectedRecord.compliance_summary.explanation}</p>
                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>Suggested Action: <strong>{selectedRecord.compliance_summary.suggested_action.replace('_', ' ').toUpperCase()}</strong></span>
                  <span>Confidence: {(selectedRecord.compliance_summary.confidence_level * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Analyst Fields */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Analyst Review</h3>
              {editingRecord === selectedRecord.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Case Notes</label>
                    <Textarea
                      value={editForm.case_notes}
                      onChange={(e) => setEditForm({ ...editForm, case_notes: e.target.value })}
                      placeholder="Add your analysis notes..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Decision</label>
                    <select
                      value={editForm.analyst_decision}
                      onChange={(e) => setEditForm({ ...editForm, analyst_decision: e.target.value as LookupRecord['analyst_fields']['analyst_decision'] })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                      <option value="escalated">Escalated</option>
                      <option value="blocked">Blocked</option>
                      <option value="no_action">No Action</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <strong>Case Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRecord.analyst_fields.case_notes || 'No notes added yet.'}
                    </p>
                  </div>
                  {selectedRecord.analyst_fields.tags.length > 0 && (
                    <div>
                      <strong>Tags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecord.analyst_fields.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRecord.analyst_fields.reviewed_at && (
                    <div className="text-xs text-gray-500">
                      Reviewed by {selectedRecord.analyst_fields.analyst_name} on {new Date(selectedRecord.analyst_fields.reviewed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending_review || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats?.risk_level_breakdown?.High || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cleared</p>
                <p className="text-2xl font-bold text-green-600">{stats?.decision_breakdown?.cleared || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search records by address, notes, or explanation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation Records ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No investigation records found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getRiskIcon(record.risk_assessment.risk_level)}
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {record.wallet_address.slice(0, 8)}...{record.wallet_address.slice(-6)}
                      </code>
                      <Badge className={getRiskColor(record.risk_assessment.risk_level)}>
                        {record.risk_assessment.risk_level}
                      </Badge>
                      <Badge className={getDecisionColor(record.analyst_fields.analyst_decision)}>
                        {record.analyst_fields.analyst_decision.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{new Date(record.created_at).toLocaleDateString()}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {record.compliance_summary.explanation}
                  </p>
                  {record.risk_assessment.key_risk_factors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {record.risk_assessment.key_risk_factors.slice(0, 3).map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                      {record.risk_assessment.key_risk_factors.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{record.risk_assessment.key_risk_factors.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
