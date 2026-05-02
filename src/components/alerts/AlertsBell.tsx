import React, { useState } from "react";
import { Bell, BellRing, CheckCheck, Activity, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useWatchAlerts, type WatchAlert } from "@/hooks/useWatchAlerts";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const alertIcon = (type: string) => {
  if (type.includes("sanction")) return AlertTriangle;
  if (type.includes("risk")) return Activity;
  return Bell;
};

const alertTone = (a: WatchAlert): string => {
  const change = Math.abs(a.risk_change ?? 0);
  if (a.alert_type.includes("sanction") || change >= 3)
    return "border-l-[hsl(var(--risk-critical))]";
  if (change >= 1.5) return "border-l-[hsl(var(--risk-high))]";
  if (change >= 0.5) return "border-l-[hsl(var(--risk-medium))]";
  return "border-l-[hsl(var(--risk-low))]";
};

const AlertsBell: React.FC = () => {
  const { alerts, unreadCount, markRead, markAllRead } = useWatchAlerts();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const Icon = unreadCount > 0 ? BellRing : Bell;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Alerts${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <Icon className={`w-5 h-5 ${unreadCount > 0 ? "text-primary animate-pulse" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--risk-critical))] text-white text-[10px] font-bold flex items-center justify-center shadow-md">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-primary" />
              Alerts
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            Real-time signals from your watched wallets.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No alerts yet.</p>
              <p className="text-xs mt-1">
                Watch a wallet to receive risk and sanctions alerts here.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {alerts.map((a) => {
                const Icn = alertIcon(a.alert_type);
                return (
                  <li
                    key={a.id}
                    className={`group px-5 py-4 border-l-4 ${alertTone(a)} ${
                      a.is_read ? "opacity-70" : "bg-primary/5"
                    } hover:bg-muted/40 transition-colors cursor-pointer`}
                    onClick={() => {
                      markRead(a.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icn className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {a.alert_type.replace(/_/g, " ")}
                          </p>
                          {!a.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        {a.alert_message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {a.alert_message}
                          </p>
                        )}
                        {a.wallet_address && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-1.5 truncate">
                            {a.wallet_address}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(false);
                              navigate("/all-records");
                            }}
                          >
                            View <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AlertsBell;
