import { createPublicClient, http, parseEther, formatEther, getAddress } from 'viem';
import { celo } from 'viem/chains';

export const CHAIN = celo;
export const CHAIN_ID = 42220;

export const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org', { retryCount: 3, retryDelay: 1000 }),
});

export const CONTRACTS = {
  CoreMarketPlace: '0xc15522d3DE1654D67342F47f8E45c59Cf622eD55' as `0x${string}`,
  EscrowService:   '0xB85F9C01f5557BA8E4e78859Ec37C8b5f41cbc21' as `0x${string}`,
  UserProfile:     '0x57A20C3C4BC8C01aF6ed7288574e972d889420c0' as `0x${string}`,
  DisputeResolution: '0x6eb97d321176F25A8661F67C285B277EC5cbc7F5' as `0x${string}`,
  GDollar:         '0x62b8B11039FCFe5Ab0c56E502B1c372A3d462a4b' as `0x${string}`,
};

// ABI matches the deployed contract (no currency field — original contract)
export const MARKETPLACE_ABI = [
  {
    name: 'createListing', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'purchaseListing', type: 'function', stateMutability: 'payable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelListing', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getListing', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'seller', type: 'address' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
      ],
    }],
  },
  {
    name: 'lastListingId', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
] as const;

export interface Listing {
  listingId: number;
  seller: string;
  name: string;
  description: string;
  price: bigint;
  status: number; // 0 = Active, 1 = Sold, 2 = Cancelled
  createdAt: bigint;
  expiresAt: bigint;
}

export const getListings = async (): Promise<Listing[]> => {
  try {
    const lastId = await publicClient.readContract({
      address: CONTRACTS.CoreMarketPlace,
      abi: MARKETPLACE_ABI,
      functionName: 'lastListingId',
    });

    if (!lastId || lastId === 0n) return [];

    const listings: Listing[] = [];
    // Fetch in parallel batches of 10 for speed
    const ids = Array.from({ length: Number(lastId) }, (_, i) => BigInt(i + 1));
    const results = await Promise.allSettled(
      ids.map(i =>
        publicClient.readContract({
          address: CONTRACTS.CoreMarketPlace,
          abi: MARKETPLACE_ABI,
          functionName: 'getListing',
          args: [i],
        })
      )
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        const l = r.value as any;
        if (l.status === 0) { // Active only
          listings.push({
            listingId: i + 1,
            seller: l.seller,
            name: l.name,
            description: l.description,
            price: l.price,
            status: l.status,
            createdAt: l.createdAt,
            expiresAt: l.expiresAt,
          });
        }
      }
    }
    return listings;
  } catch (e) {
    console.error('getListings error:', e);
    return [];
  }
};

export const formatCELO = (wei: bigint): string =>
  parseFloat(formatEther(wei)).toFixed(4);

export const formatAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('celo_address');
};

export const getConnectedAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('celo_address');
};

export const connectWallet = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) {
    alert('Please install MetaMask or a Celo-compatible wallet');
    return null;
  }
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts[0]) return null;

  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xA4EC' }] });
  } catch (e: any) {
    if (e.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xA4EC',
          chainName: 'Celo',
          nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
          rpcUrls: ['https://forno.celo.org'],
          blockExplorerUrls: ['https://explorer.celo.org/mainnet'],
        }],
      });
    }
  }

  const address = getAddress(accounts[0]);
  localStorage.setItem('celo_address', address);
  return address;
};

export const disconnectWallet = (): void => {
  localStorage.removeItem('celo_address');
};

export const getWalletBalance = async (address: string): Promise<bigint> => {
  try {
    return await publicClient.getBalance({ address: address as `0x${string}` });
  } catch {
    return 0n;
  }
};
