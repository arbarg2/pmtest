
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReport: (emailAddresses: string[]) => void;
  isLoading: boolean;
}

const MAX_RECIPIENTS = 10;

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Enter an email address' })
  .max(255, { message: 'That email address is too long' })
  .email({ message: 'That doesn’t look like a valid email address' });

const EmailReportDialog = ({ isOpen, onClose, onSendReport, isLoading }: EmailReportDialogProps) => {
  const [emailInput, setEmailInput] = useState('');
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addEmails = (raw: string) => {
    const candidates = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (candidates.length === 0) {
      setError('Enter an email address');
      return;
    }

    const accepted: string[] = [];
    for (const candidate of candidates) {
      const parsed = emailSchema.safeParse(candidate);
      if (!parsed.success) {
        setError(`${candidate}: ${parsed.error.issues[0].message}`);
        return;
      }
      if (emailAddresses.includes(parsed.data) || accepted.includes(parsed.data)) {
        setError(`${parsed.data} is already on the list`);
        return;
      }
      accepted.push(parsed.data);
    }

    if (emailAddresses.length + accepted.length > MAX_RECIPIENTS) {
      setError(`You can send to at most ${MAX_RECIPIENTS} recipients at once`);
      return;
    }

    setEmailAddresses((prev) => [...prev, ...accepted]);
    setEmailInput('');
    setError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    setEmailAddresses((prev) => prev.filter((email) => email !== emailToRemove));
    setError(null);
  };

  const handleSend = () => {
    // Allow sending straight after typing without pressing "+"
    if (emailInput.trim()) {
      addEmails(emailInput);
      return;
    }

    if (emailAddresses.length === 0) {
      setError('Add at least one recipient before sending');
      return;
    }

    setError(null);
    onSendReport(emailAddresses);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmails(emailInput);
    }
  };

  const handleClose = () => {
    setEmailInput('');
    setEmailAddresses([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary" />
            <span>Email Report</span>
          </DialogTitle>
          <DialogDescription>
            Add up to {MAX_RECIPIENTS} recipients. The report is delivered securely — separate multiple
            addresses with a comma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-input">Email address</Label>
            <div className="flex space-x-2">
              <Input
                id="email-input"
                type="email"
                placeholder="analyst@company.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-invalid={!!error}
                aria-describedby="email-error"
                className={`flex-1 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <Button
                onClick={() => addEmails(emailInput)}
                size="sm"
                variant="outline"
                disabled={isLoading}
                aria-label="Add recipient"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div id="email-error" className="min-h-[18px] text-xs" aria-live="polite">
              {error && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </span>
              )}
            </div>
          </div>

          {emailAddresses.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({emailAddresses.length}/{MAX_RECIPIENTS})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {emailAddresses.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center space-x-1 pr-1"
                  >
                    <span className="text-xs">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      disabled={isLoading}
                      aria-label={`Remove ${email}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || (emailAddresses.length === 0 && !emailInput.trim())}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Report{emailAddresses.length > 0 ? ` (${emailAddresses.length})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailReportDialog;
