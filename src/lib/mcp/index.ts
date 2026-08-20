import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listInvestigations from "./tools/list-investigations";
import getInvestigation from "./tools/get-investigation";
import screenAddress from "./tools/screen-address";
import analyzeWallet from "./tools/analyze-wallet";
import listWatchedWallets from "./tools/list-watched-wallets";
import watchWallet from "./tools/watch-wallet";
import unwatchWallet from "./tools/unwatch-wallet";
import listAlerts from "./tools/list-alerts";
import investigateDownstream from "./tools/investigate-downstream";
import getInvestigationTrace from "./tools/get-investigation-trace";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tryrian",
  title: "tryrian",
  version: "0.1.0",
  instructions:
    "Blockchain compliance tools for Rìan. Use `analyze_wallet` for a full live risk analysis of any address, `screen_address` for a fast OFAC sanctions check, `list_investigations` / `get_investigation` to review saved investigation records and AI risk summaries, `list_watched_wallets` / `watch_wallet` / `unwatch_wallet` to manage monitoring, `investigate_downstream` to launch the autonomous multi-hop forensic agent and `get_investigation_trace` to read its risk tree and narrative, and `list_alerts` to read monitoring alerts. All tools act as the signed-in analyst.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    analyzeWallet,
    screenAddress,
    listInvestigations,
    getInvestigation,
    listWatchedWallets,
    watchWallet,
    unwatchWallet,
    listAlerts,
    investigateDownstream,
    getInvestigationTrace,
  ],
});
