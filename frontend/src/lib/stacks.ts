import { STACKS_TESTNET } from '@stacks/network';
import { AppConfig, UserSession } from '@stacks/connect';
import { fetchCallReadOnlyFunction, cvToValue, ClarityType, uintCV } from '@stacks/transactions';

export const network = STACKS_TESTNET;
export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const contractAddress = 'STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF';

// Contract addresses for deployed contracts
export const CONTRACTS = {
  CoreMarketPlace: `${contractAddress}.CoreMarketPlace`,
  EscrowService: `${contractAddress}.EscrowService`,
  UserProfile: `${contractAddress}.UserProfile`,
  DisputeResolution: `${contractAddress}.DisputeResolution_clar`,
  Token: `${contractAddress}.token`,
};

// Default contract for marketplace operations
export const contractName = 'CoreMarketPlace';

export interface Listing {
  listingId: number;
  seller: string;
  name: string;
  description: string;
  price: number;
  status: string;
  createdAt: number; // block height
  expiresAt: number; // block height
  imageUrl?: string;
}

// Convert Stacks block height to approximate timestamp
// Stacks blocks are ~10 minutes apart, starting from Bitcoin block ~666050 (Jan 2021)
export const blockHeightToTimestamp = (blockHeight: number): number => {
  // Approximate: Stacks mainnet launched around Jan 2021 at Bitcoin block 666050
  // For testnet, we use a similar approximation
  const STACKS_LAUNCH_TIMESTAMP = 1611057600000; // Jan 2021 in milliseconds
  const AVERAGE_BLOCK_TIME_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  return STACKS_LAUNCH_TIMESTAMP + (blockHeight * AVERAGE_BLOCK_TIME_MS);
};

export const getListings = async (includeAll: boolean = false): Promise<Listing[]> => {
  try {
    const lastIdResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-last-listing-id',
      functionArgs: [],
      network,
      senderAddress: contractAddress,
    });

    const lastId = cvToValue(lastIdResult).value as number;
    const listings: Listing[] = [];

    for (let i = 1; i <= lastId; i++) {
      const listingResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-listing',
        functionArgs: [uintCV(i)],
        network,
        senderAddress: contractAddress,
      });

      if (listingResult.type !== ClarityType.OptionalNone) {
        const listingData = cvToValue(listingResult).value;
        listings.push({
          listingId: i,
          seller: listingData.seller.value,
          name: listingData.name.value,
          description: listingData.description.value,
          price: Number(listingData.price.value),
          status: listingData.status.value,
          createdAt: Number(listingData['created-at'].value),
          expiresAt: Number(listingData['expires-at'].value),
        });
      }
    }

    // If includeAll is true, return all listings; otherwise filter for active only
    return includeAll ? listings : listings.filter(listing => listing.status === 'active');
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
};

export const formatSTX = (microSTX: number): string => {
  // Handle NaN, undefined, or invalid values
  if (microSTX === null || microSTX === undefined || isNaN(microSTX) || microSTX < 0) {
    return '0';
  }
  return (microSTX / 1000000).toFixed(6);
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to decode hex-encoded string
const hexToString = (hex: string): string => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
};

// Check if wallet is connected (supports both old UserSession and new v8 storage)
export const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check old UserSession method
  if (userSession.isUserSignedIn()) {
    return true;
  }
  
  // Check v8 @stacks/connect storage
  const stacksConnectData = localStorage.getItem('@stacks/connect');
  if (stacksConnectData) {
    try {
      const decodedString = hexToString(stacksConnectData);
      const connectData = JSON.parse(decodedString);
      return !!(connectData?.addresses?.stx?.[0]?.address);
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

// Get the connected wallet address (supports both old UserSession and new v8 storage)
export const getConnectedAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Check old UserSession method
  if (userSession.isUserSignedIn()) {
    const userData = userSession.loadUserData();
    return userData.profile?.stxAddress?.testnet || userData.profile?.stxAddress?.mainnet || null;
  }
  
  // Check v8 @stacks/connect storage
  const stacksConnectData = localStorage.getItem('@stacks/connect');
  if (stacksConnectData) {
    try {
      const decodedString = hexToString(stacksConnectData);
      const connectData = JSON.parse(decodedString);
      return connectData?.addresses?.stx?.[0]?.address || null;
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

export const getUserBalance = async (address: string): Promise<number> => {
  try {
    if (!address || typeof address !== 'string' || address.length < 10) {
      return 0;
    }
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/stx`
    );
    
    if (!response.ok) {
      console.error('Balance API error:', response.status);
      return 0;
    }
    
    const data = await response.json();
    
    // Handle different API response formats
    if (data.balance !== undefined) {
      return Number(data.balance) || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};
