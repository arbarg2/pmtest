
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Zap, Shield, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateWalletAddress } from '@/services/walletValidation';

interface WalletLookupPanelProps {
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  stats?: {
    total_lookups: number;
    pending_review: number;
  };
}

const NETWORK_LABEL: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
};

export const WalletLookupPanel = ({
  walletAddress,
  setWalletAddress,
  onAnalyze,
  isAnalyzing,
  stats
}: WalletLookupPanelProps) => {
  const [touched, setTouched] = useState(false);

  const validation = useMemo(() => validateWalletAddress(walletAddress), [walletAddress]);
  const hasInput = walletAddress.trim().length > 0;
  const showError = touched && hasInput && !validation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validation.isValid) {
      onAnalyze();
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-primary" />
          <span>Wallet Intelligence Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter wallet address (Bitcoin, Ethereum, Solana)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value.trim())}
                onBlur={() => setTouched(true)}
                aria-label="Wallet address"
                aria-invalid={showError}
                aria-describedby="wallet-address-hint"
                className={`w-full text-sm font-mono ${showError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                disabled={isAnalyzing}
              />
            </div>
            <Button
              type="submit"
              disabled={isAnalyzing || !hasInput}
              className="px-8"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Analyze</span>
                </div>
              )}
            </Button>
          </div>

          <div id="wallet-address-hint" className="min-h-[20px] text-xs" aria-live="polite">
            {showError ? (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="w-3.5 h-3.5" />
                {validation.error}
              </span>
            ) : hasInput && validation.isValid ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--risk-low))]" />
                Detected network:
                <Badge variant="secondary" className="text-[10px]">
                  {NETWORK_LABEL[validation.network || 'ethereum']}
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Supports Bitcoin (1/3/bc1), Ethereum (0x…) and Solana addresses.
              </span>
            )}
          </div>
        </form>

        {/* Analysis Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/40 rounded-lg">
            <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Real-Time Analysis</h4>
            <p className="text-xs text-muted-foreground">Lightning-fast blockchain forensics</p>
          </div>
          <div className="text-center p-4 bg-muted/40 rounded-lg">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Risk Assessment</h4>
            <p className="text-xs text-muted-foreground">20+ risk factors analyzed</p>
          </div>
          <div className="text-center p-4 bg-muted/40 rounded-lg">
            <Database className="w-8 h-8 text-accent mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Compliance Ready</h4>
            <p className="text-xs text-muted-foreground">Audit trails & reporting</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-center space-x-8 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total_lookups || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Analyses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {stats.pending_review || 0}
              </div>
              <div className="text-xs text-muted-foreground">Pending Review</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
