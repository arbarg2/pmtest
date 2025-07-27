
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, AlertTriangle, CheckCircle, Clock, Users, Plus, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { newCaseManagementService, Case } from '@/services/newCaseManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NewCaseManagementProps {
  recordId: string;
  caseId?: string;
  onCaseLinked?: (caseId: string) => void;
}

const NewCaseManagement: React.FC<NewCaseManagementProps> = ({
  recordId,
  caseId,
  onCaseLinked
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [availableCases, setAvailableCases] = useState<Case[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateCase = async () => {
    if (!user || !caseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a case name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await newCaseManagementService.createCase({
        case_name: caseName.trim()
      }, user.id);

      if (result.success && result.case) {
        // Link the current record to the new case
        const linkResult = await newCaseManagementService.linkLookupRecordToCase(
          recordId,
          result.case.id,
          user.id
        );

        if (linkResult.success) {
          toast({
            title: "Case Created",
            description: `Case ${result.case.case_id} has been created and linked to this record`,
          });
          
          if (onCaseLinked) {
            onCaseLinked(result.case.id);
          }
          
          setShowCreateDialog(false);
          setCaseName('');
        } else {
          toast({
            title: "Error",
            description: "Case created but failed to link record",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLinkToCase = async () => {
    if (!user || !selectedCaseId) {
      toast({
        title: "Error",
        description: "Please select a case",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      const result = await newCaseManagementService.linkLookupRecordToCase(
        recordId,
        selectedCaseId,
        user.id
      );

      if (result.success) {
        toast({
          title: "Record Linked",
          description: "This record has been linked to the selected case",
        });
        
        if (onCaseLinked) {
          onCaseLinked(selectedCaseId);
        }
        
        setShowLinkDialog(false);
        setSelectedCaseId('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to link record to case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error linking record to case:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const loadAvailableCases = async () => {
    try {
      const cases = await newCaseManagementService.getAllCases();
      setAvailableCases(cases.filter(c => c.status !== 'closed'));
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleShowLinkDialog = () => {
    loadAvailableCases();
    setShowLinkDialog(true);
  };

  const handleViewCase = () => {
    if (caseId) {
      navigate(`/case/${caseId}`);
    }
  };

  if (caseId) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Folder className="w-5 h-5 mr-2 text-primary" />
              Case Management
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Linked to Case
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
              <p className="text-sm text-green-800 dark:text-green-300">
                This lookup record is linked to a case. You can view the full case details and manage it from the case view.
              </p>
            </div>
            
            <Button 
              onClick={handleViewCase}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              View Case
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Folder className="w-5 h-5 mr-2 text-primary" />
              Case Management
            </div>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">
              Not Linked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This lookup record is not linked to any case. Create a new case or link it to an existing one to enable full case management features.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Case
              </Button>
              
              <Button 
                onClick={handleShowLinkDialog}
                variant="outline"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Link to Existing Case
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Case Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Create a new investigation case and link this lookup record to it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-name">Case Name</Label>
              <Input
                id="case-name"
                placeholder="Enter a descriptive case name..."
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCase}
                disabled={isCreating || !caseName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Case'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Case Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link to Existing Case</DialogTitle>
            <DialogDescription>
              Select an existing case to link this lookup record to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-select">Select Case</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {availableCases.map((caseData) => (
                    <SelectItem key={caseData.id} value={caseData.id}>
                      {caseData.case_id} - {caseData.case_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLinkToCase}
                disabled={isLinking || !selectedCaseId}
              >
                {isLinking ? 'Linking...' : 'Link to Case'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewCaseManagement;
