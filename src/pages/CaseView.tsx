
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, User, FileText, Activity, Plus, Eye, Link } from 'lucide-react';
import { newCaseManagementService, Case, CaseActivityLog } from '@/services/newCaseManagement';
import { UserDropdown } from '@/components/UserDropdown';
import { useToast } from '@/hooks/use-toast';

const CaseViewPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [lookupRecords, setLookupRecords] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<CaseActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCase, setEditedCase] = useState<Partial<Case>>({});
  const [newNote, setNewNote] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (caseId && user) {
      fetchCaseData();
      fetchActivityLog();
    }
  }, [caseId, user]);

  const fetchCaseData = async () => {
    if (!caseId) return;
    
    setLoading(true);
    try {
      const result = await newCaseManagementService.getCaseWithLookupRecords(caseId);
      if (result) {
        setCaseData(result.case);
        setLookupRecords(result.lookupRecords);
        setEditedCase(result.case);
      }
    } catch (error) {
      console.error('Error fetching case data:', error);
      toast({
        title: "Error",
        description: "Failed to load case data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    if (!caseId) return;
    
    try {
      const logs = await newCaseManagementService.getCaseActivityLog(caseId);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  const handleUpdateCase = async () => {
    if (!caseData || !user) return;

    try {
      const result = await newCaseManagementService.updateCase(caseData.id, {
        case_name: editedCase.case_name,
        status: editedCase.status,
        overall_risk_level: editedCase.overall_risk_level
      }, user.id);

      if (result.success && result.case) {
        setCaseData(result.case);
        setIsEditing(false);
        await fetchActivityLog();
        toast({
          title: "Case Updated",
          description: "Case has been updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!caseData || !user || !newNote.trim()) return;

    try {
      await newCaseManagementService.logCaseActivity(
        caseData.id,
        user.id,
        'note_added',
        newNote.trim()
      );

      setNewNote('');
      await fetchActivityLog();
      toast({
        title: "Note Added",
        description: "Your note has been added to the case",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'str_filed': return 'bg-red-100 text-red-800 border-red-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_hold': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string | null) => {
    if (!risk) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (risk) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/cases')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/cases')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {caseData.case_id}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {caseData.case_name}
                  </p>
                </div>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Case Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Information */}
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Case Details</span>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(caseData.status)}>
                      {formatStatus(caseData.status)}
                    </Badge>
                    {caseData.overall_risk_level && (
                      <Badge className={getRiskColor(caseData.overall_risk_level)}>
                        {caseData.overall_risk_level} Risk
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="case-name">Case Name</Label>
                      <Input
                        id="case-name"
                        value={editedCase.case_name || ''}
                        onChange={(e) => setEditedCase({...editedCase, case_name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={editedCase.status || ''} onValueChange={(value) => setEditedCase({...editedCase, status: value as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending_review">Pending Review</SelectItem>
                          <SelectItem value="cleared">Cleared</SelectItem>
                          <SelectItem value="str_filed">STR Filed</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="risk-level">Risk Level</Label>
                      <Select value={editedCase.overall_risk_level || ''} onValueChange={(value) => setEditedCase({...editedCase, overall_risk_level: value as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateCase}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Case Name</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{caseData.case_name}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Status</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{formatStatus(caseData.status)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Created</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{new Date(caseData.created_at).toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Last Updated</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{new Date(caseData.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Edit Case
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Associated Lookup Records */}
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Associated Lookup Records ({lookupRecords.length})</span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lookup Record
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lookupRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Lookup Records</h3>
                    <p className="text-gray-500">
                      This case doesn't have any associated lookup records yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lookupRecords.map((record) => (
                      <div key={record.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <span className="font-medium text-slate-900">{record.record_id}</span>
                              <Badge className={getRiskColor(record.risk_level)}>
                                {record.risk_level} Risk
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div className="font-mono">{record.wallet_address}</div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(record.created_at).toLocaleDateString()}</span>
                                <span>Risk Score: {record.risk_score}/10</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => navigate(`/record/${record.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Record
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Case Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="space-y-2">
                  <Label htmlFor="new-note">Add Note</Label>
                  <Textarea
                    id="new-note"
                    placeholder="Enter your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm">
                    Add Note
                  </Button>
                </div>

                {/* Activity Log */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Activity Log</h4>
                  {activityLog.length === 0 ? (
                    <p className="text-sm text-slate-500">No activity yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activityLog.map((log) => (
                        <div key={log.id} className="border-l-2 border-slate-200 pl-4 pb-3">
                          <div className="text-sm font-medium text-slate-900">
                            {log.activity_description}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseViewPage;
