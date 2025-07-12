
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { watchedWalletsService } from '@/services/watchedWallets';

interface WatchWalletButtonProps {
  walletAddress: string;
  network: string;
  currentRiskScore: number;
  isWatched?: boolean;
  onWatchAdded?: () => void;
}

const WatchWalletButton = ({ 
  walletAddress, 
  network, 
  currentRiskScore, 
  isWatched = false,
  onWatchAdded 
}: WatchWalletButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [watchReason, setWatchReason] = useState('');
  const [alertThreshold, setAlertThreshold] = useState([0.5]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddWatch = async () => {
    if (!watchReason.trim()) {
      toast({
        title: "Watch Reason Required",
        description: "Please provide a reason for watching this wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await watchedWalletsService.addWatchedWallet(
        walletAddress,
        network,
        watchReason,
        currentRiskScore,
        alertThreshold[0]
      );

      if (result) {
        toast({
          title: "Wallet Added to Watchlist",
          description: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)} is now being monitored.`,
        });
        setIsOpen(false);
        setWatchReason('');
        setAlertThreshold([0.5]);
        if (onWatchAdded) onWatchAdded();
      } else {
        throw new Error('Failed to add wallet to watchlist');
      }
    } catch (error) {
      toast({
        title: "Failed to Add Watch",
        description: error instanceof Error ? error.message : "Could not add wallet to watchlist.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isWatched) {
    return (
      <Button variant="outline" disabled>
        <EyeOff className="w-4 h-4 mr-2" />
        Already Watched
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Watch Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Wallet to Watchlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="p-2 bg-slate-50 rounded border font-mono text-sm">
              {walletAddress}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <div className="p-2 bg-slate-50 rounded border text-sm">
              {network}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Risk Score</Label>
            <div className="p-2 bg-slate-50 rounded border text-sm">
              {currentRiskScore.toFixed(1)}/10
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="watchReason">Watch Reason *</Label>
            <Textarea
              id="watchReason"
              placeholder="Why are you watching this wallet? (e.g., suspicious activity, compliance monitoring, etc.)"
              value={watchReason}
              onChange={(e) => setWatchReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Alert Threshold</Label>
            <div className="px-2">
              <Slider
                value={alertThreshold}
                onValueChange={setAlertThreshold}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Low (0.1)</span>
              <span className="font-medium">
                Alert when risk changes by ±{alertThreshold[0].toFixed(1)}
              </span>
              <span>High (1.0)</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWatch} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add to Watchlist'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchWalletButton;
