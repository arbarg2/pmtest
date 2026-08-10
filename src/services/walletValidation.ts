export type DetectedNetwork = 'bitcoin' | 'ethereum' | 'solana';

export interface WalletValidationResult {
  isValid: boolean;
  error?: string;
  network?: DetectedNetwork;
}

const BTC_LEGACY = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_BECH32 = /^bc1[a-z0-9]{25,87}$/i;
const ETH = /^0x[a-fA-F0-9]{40}$/;
const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Detects which supported network an address belongs to, if any. */
export const detectNetwork = (address: string): DetectedNetwork | undefined => {
  const a = address.trim();
  if (ETH.test(a)) return 'ethereum';
  if (BTC_LEGACY.test(a) || BTC_BECH32.test(a)) return 'bitcoin';
  if (SOLANA.test(a)) return 'solana';
  return undefined;
};

export const validateWalletAddress = (address: string): WalletValidationResult => {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return { isValid: false, error: 'Enter a wallet address to begin.' };
  }

  if (/\s/.test(trimmedAddress)) {
    return { isValid: false, error: 'Addresses cannot contain spaces — check for a copy/paste slip.' };
  }

  if (trimmedAddress.length < 26) {
    return { isValid: false, error: 'That looks too short for a wallet address.' };
  }

  if (trimmedAddress.length > 100) {
    return { isValid: false, error: 'That looks too long for a wallet address.' };
  }

  if (trimmedAddress.startsWith('0x') && !ETH.test(trimmedAddress)) {
    return {
      isValid: false,
      error: 'Ethereum addresses must be 0x followed by 40 hex characters.',
    };
  }

  const network = detectNetwork(trimmedAddress);
  if (!network) {
    return {
      isValid: false,
      error: "We don't recognise that format. Enter a Bitcoin, Ethereum or Solana address.",
    };
  }

  return { isValid: true, network };
};

export const normalizeNetwork = (network?: string): string => {
  if (!network) return 'ethereum';

  const networkLower = network.toLowerCase();
  if (networkLower === 'bitcoin' || networkLower === 'btc') {
    return 'bitcoin';
  } else if (networkLower === 'ethereum' || networkLower === 'eth') {
    return 'ethereum';
  } else if (networkLower === 'solana' || networkLower === 'sol') {
    return 'solana';
  }
  return 'ethereum';
};
