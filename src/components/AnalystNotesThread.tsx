import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback
} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';

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

// Helper to write directly to the DB and bypass type mismatch
async function updateRawRecord(recordId: string, updates: Record<string, any>) {
  return await supabase
    .from('investigation_records')
    .update(updates)
    .eq('id', recordId);
}

const AnalystNotesThread = forwardRef<AnalystNotesThreadRef, AnalystNotesThreadProps>(
  ({ recordId, initialNotes = '', initialStatus = 'pending', onNotesUpdate }, ref) => {
    const [currentNote, setCurrentNote] = useState('');
    const [currentStatus, setCurrentStatus] = useState<'pending' | 'cleared' | 'blocked' | 'escalated'>(
      initialStatus as any
    );
    const [noteHistory, setNoteHistory] = useState<AnalystNote[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
      if (recordId && user) {
        loadNoteHistory();
      }
    }, [recordId, user]);

    const loadNoteHistory = useCallback(async () => {
      if (!recordId || !user) return;

      console.log('📖 Loading note history for recordId:', recordId, 'userId:', user.id);
      setIsLoading(true);
      try {
        const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);

        if (result.success && result.record) {
          const record = result.record as any;
          const existingNotes = record.analyst_notes ?? '';
          const status = record.investigation_status || 'pending';

          console.log('📝 Loaded from DB:', {
            recordId,
            analyst_notes: existingNotes ? 'Present' : 'Empty',
            investigation_status: status
          });

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
                  author: user.email || 'Unknown'
                }
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
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }, [recordId, user]);

    useEffect(() => {
      if (recordId && user && refreshTrigger > 0) {
        loadNoteHistory();
      }
    }, [refreshTrigger, loadNoteHistory, recordId, user]);

    useImperativeHandle(ref, () => ({
      refreshNotes: () => {
        setRefreshTrigger(prev => prev + 1);
      }
    }));

    const handleAddNote = async () => {
      if (!currentNote.trim() || !recordId || !user) return;

      console.log('💾 Adding note for recordId:', recordId);
      setIsSaving(true);

      const newNote: AnalystNote = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        status: currentStatus,
        timestamp: new Date().toISOString(),
        author: user.email || 'Unknown'
      };

      const updatedNotes = [...noteHistory, newNote];

      try {
        const { error } = await updateRawRecord(recordId, {
          analyst_notes: JSON.stringify(updatedNotes),
          investigation_status: currentStatus
        });

        if (error) {
          throw error;
        }

        console.log('✅ Note saved successfully for recordId:', recordId);
        setCurrentNote('');
        setNoteHistory(updatedNotes);
        setRefreshTrigger(prev => prev + 1);

        toast({
          title: 'Note Added',
          description: 'Your note has been saved.',
        });

        onNotesUpdate?.(updatedNotes, currentStatus);
      } catch (err) {
        console.error('❌ Error saving note:', err);
        toast({
          title: 'Error Saving',
          description: 'Note could not be saved.',
          variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
    };

    const handleStatusChange = async (newStatus: string) => {
      if (!recordId || !user) return;

      console.log('🔄 Changing status for recordId:', recordId, 'to:', newStatus);

      try {
        const { error } = await updateRawRecord(recordId, {
          investigation_status: newStatus
        });

        if (error) {
          throw error;
        }

        console.log('✅ Status updated successfully for recordId:', recordId);
        setCurrentStatus(newStatus as any);
        toast({
          title: 'Status Updated',
          description: `Investigation status changed to ${newStatus}`,
        });

        onNotesUpdate?.(noteHistory, newStatus);
      } catch (err) {
        console.error('❌ Error updating status:', err);
        toast({
          title: 'Error Updating Status',
          description: 'Status could not be updated.',
          variant: 'destructive'
        });
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'cleared':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'blocked':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'escalated':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        default:
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
    };

    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              Analyst Notes & Status
            </div>
            <Badge className={getStatusColor(currentStatus)}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Investigation Status</Label>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
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
            <div className="text-sm text-gray-500">Loading notes...</div>
          ) : noteHistory.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Investigation History</Label>
              <div className="max-h-60 overflow-y-auto space-y-3 border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                {noteHistory.map(note => (
                  <div key={`${note.id}-${note.timestamp}`} className="border-l-2 border-primary pl-3 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{note.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getStatusColor(note.status)}`}>{note.status}</Badge>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-4">No investigation notes yet</div>
          )}

          <div>
            <Label htmlFor="newNote" className="text-sm font-medium">Add New Note</Label>
            <Textarea
              id="newNote"
              placeholder="Enter your investigation notes..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleAddNote}
            disabled={isSaving || !currentNote.trim()}
            className="w-full bg-primary hover:bg-primary/90"
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
