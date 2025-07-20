import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const AnalystNotesThread = forwardRef<AnalystNotesThreadRef, AnalystNotesThreadProps>(({ 
  recordId, 
  initialNotes = '', 
  initialStatus = 'pending',
  onNotesUpdate 
}, ref) => {
  const [currentNote, setCurrentNote] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'cleared' | 'blocked' | 'escalated'>(initialStatus as any);
  const [noteHistory, setNoteHistory] = useState<AnalystNote[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing notes when component mounts or when recordId/user changes
  useEffect(() => {
    if (recordId && user) {
      console.log('Loading note history for record:', recordId);
      loadNoteHistory();
    } else if (initialNotes) {
      // If we have initial notes but no record ID, show them as a single note
      setNoteHistory([{
        id: 'initial',
        content: initialNotes,
        status: initialStatus,
        timestamp: new Date().toISOString(),
        author: user?.email || 'Unknown'
      }]);
    }
  }, [recordId, user, initialNotes, initialStatus]);

  // Add effect to trigger refresh when refreshTrigger changes
  useEffect(() => {
    if (recordId && user && refreshTrigger > 0) {
      console.log('RefreshTrigger changed, reloading notes...', refreshTrigger);
      loadNoteHistory();
    }
  }, [refreshTrigger, recordId, user]);

  const loadNoteHistory = async () => {
    if (!recordId || !user) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching record for notes:', recordId);
      const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);
      
      if (result.success && result.record) {
        console.log('Loaded record for notes:', result.record);
        
        // Parse existing notes into thread format
        const existingNotes = result.record.analyst_notes || '';
        const status = result.record.investigation_status || 'pending';
        
        setCurrentStatus(status as any);
        
        let parsedNotes: AnalystNote[] = [];
        
        if (existingNotes) {
          // Try to parse as JSON for threaded format, fallback to single note
          try {
            const parsed = JSON.parse(existingNotes);
            if (Array.isArray(parsed)) {
              console.log('Setting note history from parsed JSON:', parsed);
              parsedNotes = parsed;
            } else {
              // Single note format
              parsedNotes = [{
                id: Date.now().toString(),
                content: existingNotes,
                status: status,
                timestamp: result.record.created_at,
                author: user.email || 'Unknown'
              }];
            }
          } catch {
            // Plain text note
            parsedNotes = [{
              id: Date.now().toString(),
              content: existingNotes,
              status: status,
              timestamp: result.record.created_at,
              author: user.email || 'Unknown'
            }];
          }
        }

        // If this is a case, also fetch case notes
        if (result.record.is_case && result.record.case_id) {
          console.log('Fetching case notes for case:', result.record.case_id);
          try {
            const { data: caseNotes, error } = await supabase
              .from('case_audit_log')
              .select('*')
              .eq('case_id', result.record.case_id)
              .eq('action', 'note_added')
              .order('created_at', { ascending: true });

            if (error) {
              console.error('Error fetching case notes:', error);
            } else if (caseNotes && caseNotes.length > 0) {
              console.log('Found case notes:', caseNotes);
              
              // Convert case notes to analyst note format and add to existing notes
              const caseNotesFormatted = caseNotes.map(note => ({
                id: note.id,
                content: note.details?.note || 'Case note',
                status: status,
                timestamp: note.created_at,
                author: note.details?.author || 'System'
              }));
              
              // Combine and sort all notes by timestamp
              parsedNotes = [...parsedNotes, ...caseNotesFormatted].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            }
          } catch (caseError) {
            console.error('Error fetching case notes:', caseError);
          }
        }
        
        console.log('Final note history:', parsedNotes);
        setNoteHistory(parsedNotes);
      } else {
        console.log('Failed to load record for notes:', result.error);
        toast({
          title: "Loading Failed",
          description: result.error || "Failed to load investigation notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading note history:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load investigation history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refreshNotes method to parent component via ref
  useImperativeHandle(ref, () => ({
    refreshNotes: () => {
      console.log('External refresh trigger activated - incrementing refreshTrigger');
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  const handleAddNote = async () => {
    if (!currentNote.trim()) {
      toast({
        title: "Empty Note",
        description: "Please enter a note before saving",
        variant: "destructive",
      });
      return;
    }

    if (!recordId || !user) {
      toast({
        title: "Missing Information",
        description: "Record ID or user information is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newNote: AnalystNote = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        status: currentStatus,
        timestamp: new Date().toISOString(),
        author: user.email || 'Unknown'
      };

      const updatedHistory = [...noteHistory, newNote];
      
      console.log('Saving note to record:', recordId, 'Note:', newNote);
      
      // Save to database
      const result = await supabaseLookupRecords.updateLookupRecord(
        recordId,
        user.id,
        {
          analyst_fields: {
            case_notes: JSON.stringify(updatedHistory),
            analyst_decision: currentStatus,
            tags: [],
            attachments: []
          }
        }
      );

      if (result.success) {
        console.log('Successfully saved note, updating local state immediately');
        // Update local state immediately for instant UI feedback
        setNoteHistory(updatedHistory);
        setCurrentNote('');
        
        // Notify parent component
        if (onNotesUpdate) {
          onNotesUpdate(updatedHistory, currentStatus);
        }
        
        toast({
          title: "Note Added",
          description: "Your analyst note has been saved successfully.",
        });
      } else {
        console.error('Failed to save note:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save analyst note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!recordId || !user) {
      setCurrentStatus(newStatus as any);
      return;
    }

    try {
      console.log('Updating status to:', newStatus);
      
      const result = await supabaseLookupRecords.updateLookupRecord(
        recordId,
        user.id,
        {
          analyst_fields: {
            case_notes: JSON.stringify(noteHistory),
            analyst_decision: newStatus as any,
            tags: [],
            attachments: []
          }
        }
      );

      if (result.success) {
        setCurrentStatus(newStatus as any);
        
        if (onNotesUpdate) {
          onNotesUpdate(noteHistory, newStatus);
        }
        
        toast({
          title: "Status Updated",
          description: `Investigation status changed to ${newStatus}`,
        });
      } else {
        console.error('Failed to update status:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (!user) {
    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg border-0">
        <CardContent className="p-6">
          <p className="text-slate-500 text-center">Please log in to add analyst notes</p>
        </CardContent>
      </Card>
    );
  }

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
        {/* Status Selection */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium">Investigation Status</Label>
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

        {/* Note History Thread */}
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading notes...</span>
          </div>
        ) : noteHistory.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Investigation History</Label>
            <div className="max-h-60 overflow-y-auto space-y-3 border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
              {noteHistory.map((note, index) => (
                <div key={note.id} className="border-l-2 border-primary pl-3 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {note.author}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(note.status)}`}>
                        {note.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-4">
            No investigation notes yet
          </div>
        )}

        {/* New Note Input */}
        <div>
          <Label htmlFor="newNote" className="text-sm font-medium">Add New Note</Label>
          <Textarea
            id="newNote"
            placeholder="Enter your investigation notes, findings, and recommendations..."
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

        {!recordId && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ No record ID found. Notes will not be saved to the database.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AnalystNotesThread.displayName = 'AnalystNotesThread';

export default AnalystNotesThread;
