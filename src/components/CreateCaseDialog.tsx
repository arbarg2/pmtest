
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { newCaseManagementService, Case } from '@/services/newCaseManagement';
import { useToast } from '@/hooks/use-toast';

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseCreated: (newCase: Case) => void;
}

export const CreateCaseDialog: React.FC<CreateCaseDialogProps> = ({
  open,
  onOpenChange,
  onCaseCreated
}) => {
  const [caseName, setCaseName] = useState('');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High' | 'Critical' | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a case",
        variant: "destructive",
      });
      return;
    }

    if (!caseName.trim()) {
      toast({
        title: "Case Name Required",
        description: "Please enter a case name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await newCaseManagementService.createCase({
        case_name: caseName.trim(),
        overall_risk_level: riskLevel || undefined
      }, user.id);

      if (result.success && result.case) {
        onCaseCreated(result.case);
        setCaseName('');
        setRiskLevel('');
        onOpenChange(false);
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

  const handleClose = () => {
    setCaseName('');
    setRiskLevel('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Create a new investigation case. You can add lookup records to this case later.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case-name">Case Name *</Label>
            <Input
              id="case-name"
              placeholder="Enter a descriptive case name..."
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk-level">Overall Risk Level (Optional)</Label>
            <Select value={riskLevel} onValueChange={(value) => setRiskLevel(value as any)}>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
