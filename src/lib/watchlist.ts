// Local (signed-out) watchlist. Signed-in users are stored in `watched_wallets`.

const WATCH_KEY = "rian:safe:watch";

export function readLocalWatchlist(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(WATCH_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((a) => typeof a === "string") : [];
  } catch {
    return [];
  }
}

export function isLocallyWatched(address: string): boolean {
  return readLocalWatchlist().some((a) => a.toLowerCase() === address.toLowerCase());
}

/** Returns the new watched state. */
export function toggleLocalWatch(address: string): boolean {
  const list = readLocalWatchlist();
  const i = list.findIndex((a) => a.toLowerCase() === address.toLowerCase());
  if (i >= 0) {
    list.splice(i, 1);
    localStorage.setItem(WATCH_KEY, JSON.stringify(list));
    return false;
  }
  list.push(address);
  localStorage.setItem(WATCH_KEY, JSON.stringify(list));
  return true;
}
