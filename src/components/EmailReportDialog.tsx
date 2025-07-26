
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReport: (emailAddresses: string[]) => void;
  isLoading: boolean;
}

const EmailReportDialog = ({ isOpen, onClose, onSendReport, isLoading }: EmailReportDialogProps) => {
  const [emailInput, setEmailInput] = useState('');
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (emailAddresses.includes(trimmedEmail)) {
      toast.error("Email address already added");
      return;
    }

    setEmailAddresses(prev => [...prev, trimmedEmail]);
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEmailAddresses(prev => prev.filter(email => email !== emailToRemove));
  };

  const handleSend = () => {
    if (emailAddresses.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    onSendReport(emailAddresses);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleClose = () => {
    setEmailInput('');
    setEmailAddresses([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Email Report</span>
          </DialogTitle>
          <DialogDescription>
            Enter email addresses to send the wallet intelligence report to. The report will be sent via secure webhook.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-input">Email Address</Label>
            <div className="flex space-x-2">
              <Input
                id="email-input"
                type="email"
                placeholder="analyst@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={addEmail} 
                size="sm" 
                variant="outline"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {emailAddresses.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({emailAddresses.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {emailAddresses.map((email) => (
                  <Badge 
                    key={email} 
                    variant="secondary" 
                    className="flex items-center space-x-1 pr-1"
                  >
                    <span className="text-xs">{email}</span>
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      disabled={isLoading}
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
            disabled={emailAddresses.length === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Report ({emailAddresses.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailReportDialog;
