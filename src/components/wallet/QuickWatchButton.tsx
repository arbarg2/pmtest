import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { watchedWalletsService } from "@/services/watchedWallets";
import { isLocallyWatched, toggleLocalWatch } from "@/lib/watchlist";

interface QuickWatchButtonProps {
  address: string;
  network: string;
  /** 0-100 risk score from the verdict. */
  riskScore: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * One-tap "watch this address" for the consumer flows.
 * Signed in  -> real monitoring row in `watched_wallets` (daily re-screen + alerts).
 * Signed out -> local watchlist, with a nudge to sign in for real alerts.
 */
export default function QuickWatchButton({
  address,
  network,
  riskScore,
  size = "sm",
  className = "",
}: QuickWatchButtonProps) {
  const { user } = useAuth();
  const [watched, setWatched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setWatched(isLocallyWatched(address));
        return;
      }
      try {
        const list = await watchedWalletsService.getWatchedWallets();
        if (!cancelled) {
          setWatched(
            (list ?? []).some(
              (w: any) => String(w.wallet_address).toLowerCase() === address.toLowerCase(),
            ),
          );
        }
      } catch {
        if (!cancelled) setWatched(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, user]);

  const onClick = async () => {
    if (!user) {
      const now = toggleLocalWatch(address);
      setWatched(now);
      if (now) {
        toast.success("Saved to your watchlist", {
          description: "Sign in to get alerts when this wallet's risk changes.",
        });
      } else {
        toast.success("Removed from watchlist");
      }
      return;
    }

    if (watched) {
      toast.info("Already monitored", { description: "Manage it from the Pro Console." });
      return;
    }

    setBusy(true);
    try {
      const ok = await watchedWalletsService.addWatchedWallet(
        address,
        network,
        "Added from a consumer safety check",
        Math.round((riskScore / 10) * 10) / 10,
        0.5,
      );
      if (!ok) throw new Error("Could not add to monitoring");
      setWatched(true);
      toast.success("Monitoring this wallet", {
        description: "We re-screen it daily and alert you if the risk changes.",
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start monitoring");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={busy}
      variant={watched ? "default" : "outline"}
      size={size}
      className={`gap-2 ${watched ? "bg-aurora text-background hover:opacity-90" : ""} ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : watched ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {watched ? (user ? "Monitoring" : "Watching") : "Watch this address"}
    </Button>
  );
}
