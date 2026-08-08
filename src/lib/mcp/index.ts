import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listInvestigations from "./tools/list-investigations";
import getInvestigation from "./tools/get-investigation";
import screenAddress from "./tools/screen-address";
import listWatchedWallets from "./tools/list-watched-wallets";
import watchWallet from "./tools/watch-wallet";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tryrian",
  title: "tryrian",
  version: "0.1.0",
  instructions:
    "Blockchain compliance tools for Rìan. Use `list_investigations` and `get_investigation` to review the analyst's wallet investigation records and AI risk summaries, `screen_address` to check an address against the synced OFAC sanctions list, and `list_watched_wallets` / `watch_wallet` to manage wallet monitoring. All tools act as the signed-in analyst.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listInvestigations, getInvestigation, screenAddress, listWatchedWallets, watchWallet],
});
