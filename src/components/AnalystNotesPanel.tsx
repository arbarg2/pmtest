
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, X, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { lookupRecordService } from '@/services/lookupRecords';

interface AnalystNotesPanelProps {
  recordId: string;
  initialNotes?: string;
  initialDecision?: string;
  initialTags?: string[];
  onUpdate?: () => void;
}

export function AnalystNotesPanel({ 
  recordId, 
  initialNotes = '', 
  initialDecision = 'pending',
  initialTags = [],
  onUpdate 
}: AnalystNotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [decision, setDecision] = useState(initialDecision);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const predefinedTags = [
    'High Risk', 'Sanctioned Entity', 'Mixer Activity', 'Exchange Wallet',
    'Fraud Indicators', 'Enhanced Monitoring', 'SAR Filed', 'Approved',
    'Blocked', 'Under Investigation', 'Compliance Review', 'KYC Required'
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await lookupRecordService.updateLookupRecord(recordId, {
        case_notes: notes,
        analyst_decision: decision as any,
        tags
      });
      
      toast({
        title: "Notes Saved",
        description: "Analyst notes and decision have been updated successfully.",
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save analyst notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addPredefinedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'blocked': return <X className="w-4 h-4 text-red-600" />;
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Analyst Case Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Decision Selection */}
        <div className="space-y-2">
          <Label htmlFor="decision">Analyst Decision</Label>
          <div className="flex items-center space-x-4">
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Badge className={`${getDecisionColor(decision)} flex items-center space-x-1`}>
              {getDecisionIcon(decision)}
              <span className="capitalize">{decision}</span>
            </Badge>
          </div>
        </div>

        {/* Case Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Case Notes</Label>
          <Textarea
            id="notes"
            placeholder="Enter detailed case notes, observations, and analysis rationale..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-gray-500">
            Document your analysis, decision rationale, and any additional compliance considerations.
          </p>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
          <Label>Classification Tags</Label>
          
          {/* Current Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Custom Tag */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add custom tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button onClick={addTag} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Predefined Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Quick Tags:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.filter(tag => !tags.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addPredefinedTag(tag)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>

        {/* Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Compliance Note:</strong> All analyst notes and decisions are automatically 
            timestamped and stored for regulatory audit purposes. Ensure all entries are accurate 
            and comply with your organization's AML/KYC documentation standards.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
