
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { toast } from 'sonner';

interface AnalystAssignmentProps {
  recordId: string;
  currentAssignee?: string;
  onAssignmentChange?: (assignee: string) => void;
}

export const AnalystAssignment: React.FC<AnalystAssignmentProps> = ({
  recordId,
  currentAssignee,
  onAssignmentChange
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'me' | 'other'>('me');
  const [analystEmail, setAnalystEmail] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignment = async () => {
    if (!user || !recordId) return;

    setIsAssigning(true);
    try {
      let assigneeUserId = '';
      let assigneeEmail = '';
      
      if (assignmentType === 'me') {
        assigneeUserId = user.id;
        assigneeEmail = user.email || '';
      } else {
        if (!analystEmail.trim()) {
          toast.error('Please enter an analyst email address');
          setIsAssigning(false);
          return;
        }
        
        // For the assigned_to field, we'll use null since we don't have the actual user UUID
        // We'll store the email in the analyst_notes instead
        assigneeUserId = ''; // Leave empty since we don't have the UUID
        assigneeEmail = analystEmail.trim();
      }

      console.log('🔄 Assigning report to analyst:', assigneeEmail, 'User ID:', assigneeUserId, 'Record ID:', recordId);
      
      // Prepare the update data - only include assigned_to if we have a valid UUID
      const updateData: any = {
        analyst_notes: `Assigned to: ${assigneeEmail}`,
        investigation_status: 'pending'
      };

      // Only set assigned_to if we have a valid UUID (when assigning to self)
      if (assignmentType === 'me' && assigneeUserId) {
        updateData.assigned_to = assigneeUserId;
      }

      const result = await supabaseLookupRecords.updateLookupRecord(recordId, user.id, updateData);

      if (result.success) {
        toast.success(`Report assigned to ${assigneeEmail}`);
        setIsOpen(false);
        setAnalystEmail('');
        if (onAssignmentChange) {
          onAssignmentChange(assigneeEmail);
        }
      } else {
        console.error('Assignment failed:', result.error);
        toast.error('Failed to assign report');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign report');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {currentAssignee ? 'Reassign' : 'Assign to Analyst'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Report to Analyst</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentAssignee && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <User className="w-4 h-4" />
                Currently assigned to: {currentAssignee}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <Select value={assignmentType} onValueChange={(value: 'me' | 'other') => setAssignmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Assign to Me</SelectItem>
                <SelectItem value="other">Assign to Another Analyst</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentType === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="analyst-email">Analyst Email</Label>
              <Input
                id="analyst-email"
                type="email"
                placeholder="Enter analyst email address"
                value={analystEmail}
                onChange={(e) => setAnalystEmail(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignment} disabled={isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
