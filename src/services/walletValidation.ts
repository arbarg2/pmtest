
export const validateWalletAddress = (address: string): { isValid: boolean; error?: string } => {
  const trimmedAddress = address.trim();
  
  if (!trimmedAddress) {
    return { isValid: false, error: "Please enter a valid wallet address" };
  }

  // Basic format validation
  const isValidBitcoin = trimmedAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || trimmedAddress.startsWith('bc1');
  const isValidEthereum = trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/);
  
  if (!isValidBitcoin && !isValidEthereum) {
    return { isValid: false, error: "Please enter a valid Bitcoin or Ethereum address" };
  }

  return { isValid: true };
};

export const normalizeNetwork = (network?: string): string => {
  if (!network) return 'ethereum';
  
  const networkLower = network.toLowerCase();
  if (networkLower === 'bitcoin' || networkLower === 'btc') {
    return 'bitcoin';
  } else if (networkLower === 'ethereum' || networkLower === 'eth') {
    return 'ethereum';
  }
  return 'ethereum';
};
