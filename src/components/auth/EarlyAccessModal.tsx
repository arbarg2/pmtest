
import React, { useState } from 'react';
import { X, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RegistrationForm from './RegistrationForm';

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EarlyAccessModal = ({ isOpen, onClose }: EarlyAccessModalProps) => {
  const [step, setStep] = useState<'code' | 'registration'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    try {
      // Simulate API call to validate early access code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept "RIAN2024" as valid code
      if (accessCode.toUpperCase() === 'RIAN2024') {
        setStep('registration');
      } else {
        setError('Invalid early access code. Please try again.');
      }
    } catch (err) {
      setError('Failed to validate code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegistrationSuccess = () => {
    onClose();
    // In a real app, this would redirect to the dashboard
    window.location.href = '/dashboard';
  };

  const handleClose = () => {
    setStep('code');
    setAccessCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {step === 'code' ? 'Early Access' : 'Create Your Account'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {step === 'code' ? (
            <div>
              <p className="text-slate-600 mb-6">
                Enter your early access code to get started with Rìan's advanced blockchain intelligence platform.
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="accessCode">Early Access Code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter your access code"
                    className="mt-1"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isValidating || !accessCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Code'
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Demo Code:</strong> Try "RIAN2024" to access the registration form.
                </p>
              </div>
            </div>
          ) : (
            <RegistrationForm onSuccess={handleRegistrationSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EarlyAccessModal;
