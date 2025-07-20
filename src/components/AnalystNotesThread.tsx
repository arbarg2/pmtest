
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Clock, User } from 'lucide-react';

interface AnalystNote {
  id: string;
  content: string;
  status: string;
  timestamp: string;
  author: string;
}

interface AnalystNotesThreadProps {
  recordId?: string;
  initialNotes?: string;
  initialStatus?: string;
  onNotesUpdate?: (notes: AnalystNote[], status: string) => void;
}

export interface AnalystNotesThreadRef {
  refreshNotes: () => void;
}

const AnalystNotesThread = forwardRef<AnalystNotesThreadRef, AnalystNotesThreadProps>(
  ({ recordId, initialNotes = '', initialStatus = 'pending', onNotesUpdate }, ref) => {
    const [currentNote, setCurrentNote] = useState('');
    const [currentStatus, setCurrentStatus] = useState<'pending' | 'cleared' | 'blocked' | 'escalated'>(initialStatus as any);
    const [noteHistory, setNoteHistory] = useState<AnalystNote[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const loadNoteHistory = useCallback(async () => {
      if (!recordId || !user) return;

      console.log('🔄 loadNoteHistory called with recordId:', recordId);
      setIsLoading(true);
      try {
        const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);

        if (result.success && result.record) {
          const record = result.record as any;
          console.log('📊 Fresh record from DB:', {
            analyst_notes: record.analyst_notes ? 'Present' : 'Empty',
            investigation_status: record.investigation_status
          });
          
          const existingNotes = record.analyst_notes ?? '';
          const status = record.investigation_status || 'pending';
          setCurrentStatus(status);

          let parsedNotes: AnalystNote[] = [];

          if (existingNotes) {
            try {
              const parsed = JSON.parse(existingNotes);
              parsedNotes = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              parsedNotes = [
                {
                  id: Date.now().toString(),
                  content: existingNotes,
                  status,
                  timestamp: record.created_at,
                  author: user.email || 'Unknown',
                },
              ];
            }
          }

          setNoteHistory(parsedNotes);
          console.log('📋 Set note history with', parsedNotes.length, 'notes');
        }
      } catch (error) {
        console.error('❌ Error loading note history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load note history',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }, [recordId, user, toast]);

    useEffect(() => {
      if (recordId && user) {
        loadNoteHistory();
      }
    }, [recordId, user, loadNoteHistory]);

    useImperativeHandle(ref, () => ({
      refreshNotes: loadNoteHistory,
    }));

    const handleAddNote = async () => {
      if (!currentNote.trim() || !recordId || !user) return;

      console.log('💾 handleAddNote called with recordId:', recordId);
      setIsSaving(true);
      
      const newNote: AnalystNote = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        status: currentStatus,
        timestamp: new Date().toISOString(),
        author: user.email || 'Unknown',
      };

      const updatedNotes = [...noteHistory, newNote];

      // Optimistically update the UI immediately
      setNoteHistory(updatedNotes);
      setCurrentNote('');

      try {
        const { error } = await supabaseLookupRecords.updateLookupRecord(recordId, user.id, {
          analyst_notes: JSON.stringify(updatedNotes),
          investigation_status: currentStatus,
        });

        if (error) throw error;

        toast({ title: 'Note Added', description: 'Your note has been saved.' });
        onNotesUpdate?.(updatedNotes, currentStatus);
      } catch (err) {
        console.error('❌ Error saving note:', err);
        
        // Rollback the optimistic update on error
        setNoteHistory(noteHistory);
        setCurrentNote(currentNote.trim());
        
        toast({
          title: 'Error Saving',
          description: 'Note could not be saved.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    };

    const handleStatusChange = async (newStatus: string) => {
      if (!recordId || !user) return;

      console.log('🔄 handleStatusChange called with recordId:', recordId, 'status:', newStatus);

      // Optimistically update the UI immediately
      const previousStatus = currentStatus;
      setCurrentStatus(newStatus as any);

      try {
        const { error } = await supabaseLookupRecords.updateLookupRecord(recordId, user.id, {
          investigation_status: newStatus,
        });

        if (error) throw error;

        toast({
          title: 'Status Updated',
          description: `Investigation status changed to ${newStatus}`,
        });
        onNotesUpdate?.(noteHistory, newStatus);
      } catch (err) {
        console.error('❌ Error updating status:', err);
        
        // Rollback the optimistic update on error
        setCurrentStatus(previousStatus);
        
        toast({
          title: 'Error Updating Status',
          description: 'Status could not be updated.',
          variant: 'destructive',
        });
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'cleared': return 'bg-green-100 text-green-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        case 'escalated': return 'bg-orange-100 text-orange-800';
        default: return 'bg-yellow-100 text-yellow-800';
      }
    };

    if (!user || !recordId) return <div>Loading analyst notes...</div>;

    console.log('🔁 Rendering noteHistory:', noteHistory);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyst Notes & Status</CardTitle>
          <div>{currentStatus}</div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Investigation Status</Label>
            <Select onValueChange={handleStatusChange} value={currentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div>Loading notes...</div>
          ) : noteHistory.length > 0 ? (
            <div>
              <div className="font-semibold mb-2">Investigation History</div>
              {noteHistory.map((note) => (
                <div key={`${note.id}-${note.timestamp}`} className="mb-2">
                  <div className="text-sm text-gray-500">{note.author} - {new Date(note.timestamp).toLocaleString()}</div>
                  <div className="text-sm">{note.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>No investigation notes yet</div>
          )}

          <div className="mt-4">
            <Label>Add New Note</Label>
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleAddNote}
            disabled={isSaving || !currentNote.trim()}
            className="w-full mt-2"
          >
            {isSaving ? 'Saving...' : 'Add Note'}
          </Button>
        </CardContent>
      </Card>
    );
  }
);

AnalystNotesThread.displayName = 'AnalystNotesThread';

export default AnalystNotesThread;
