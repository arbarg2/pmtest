import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { caseManagementService } from '@/services/caseManagement';
import { useAuth } from '@/contexts/AuthContext';

interface CaseManagementProps {
  recordId: string;
  isCase: boolean;
  caseId?: string;
  caseStatus?: string;
  caseCreatedAt?: string;
  onCaseCreated?: (caseId: string) => void;
  onStatusChanged?: () => void;
}

const CaseManagement = ({
  recordId,
  isCase,
  caseId,
  caseStatus = 'open',
  caseCreatedAt,
  onCaseCreated,
  onStatusChanged
}: CaseManagementProps) => {
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateCase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a case.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingCase(true);
    try {
      console.log('Creating case for record ID:', recordId);
      const result = await caseManagementService.createCase(recordId, user.id);
      
      if (result.success && result.caseId) {
        toast({
          title: "Case Created Successfully",
          description: `Case ${result.caseId} has been created. You can now manage it in the Case Management dashboard.`,
        });
        
        if (onCaseCreated) {
          onCaseCreated(result.caseId);
        }
      } else {
        toast({
          title: "Case Creation Failed",
          description: result.error || "Failed to create case. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !caseId) {
      toast({
        title: "Error",
        description: "Unable to update status. Missing case information.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdatingStatus(true);
    try {
      const result = await caseManagementService.updateCaseStatus(caseId, newStatus);
      
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Case status has been updated to ${newStatus}.`,
        });
        
        if (onStatusChanged) {
          onStatusChanged();
        }
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update case status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating case status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'escalated': return <AlertTriangle className="w-4 h-4" />;
      case 'cleared': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isCase) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Folder className="w-5 h-5 mr-2 text-primary" />
              Record Management
            </div>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">
              Record Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This is currently a lookup record. Create a case to enable full investigation management features.
            </p>
            
            <Button 
              onClick={handleCreateCase}
              disabled={isCreatingCase}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isCreatingCase ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Case...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4" />
                  <span>Create Case</span>
                </div>
              )}
            </Button>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 Creating a case will enable analyst notes, status tracking, assignment, and full case management features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Folder className="w-5 h-5 mr-2 text-primary" />
            Case Management
          </div>
          <Badge className={getStatusColor(caseStatus)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(caseStatus)}
              <span className="capitalize">{caseStatus}</span>
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Case Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Case ID</div>
            <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
              {caseId || 'N/A'}
            </div>
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Created</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {caseCreatedAt ? new Date(caseCreatedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Case Status</h4>
          <Select value={caseStatus} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          {isUpdatingStatus && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Updating status...</span>
            </div>
          )}
        </div>

        {/* Case Actions */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">Case Active</div>
              <div className="text-sm text-green-700 dark:text-green-400">
                Full case management features are now available including analyst notes, 
                status tracking, and audit logging.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseManagement;
