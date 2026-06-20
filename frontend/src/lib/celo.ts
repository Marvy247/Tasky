import { createPublicClient, http, formatEther, getAddress } from 'viem';
import { celo } from 'viem/chains';

export const CHAIN = celo;
export const CHAIN_ID = 42220;

export const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org', { retryCount: 3 }),
});

export const CONTRACTS = {
  BountyBoard: '0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA' as `0x${string}`,
  GDollar: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as `0x${string}`,
};

export const BOUNTYBOARD_ABI = [
  {
    name: 'postBounty', type: 'function', stateMutability: 'payable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'reward', type: 'uint256' },
      { name: 'currency', type: 'uint8' },
      { name: 'deadline', type: 'uint256' },
      { name: 'referrer', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimBounty', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'submitProof', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'proof', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'approveSubmission', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelBounty', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getActiveBounties', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'getUserBounties', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'bounties', type: 'function', stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'poster', type: 'address' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'reward', type: 'uint256' },
      { name: 'currency', type: 'uint8' },
      { name: 'deadline', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'worker', type: 'address' },
      { name: 'proof', type: 'string' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'referrer', type: 'address' },
    ],
  },
  {
    name: 'bountyCount', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
  {
    name: 'platformFeeBps', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
] as const;

export const GD_ABI = [
  {
    name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export interface Bounty {
  id: number;
  poster: string;
  title: string;
  description: string;
  reward: bigint;
  currency: number;
  deadline: bigint;
  status: number;
  worker: string;
  proof: string;
  createdAt: bigint;
  referrer: string;
}

export const formatCELO = (wei: bigint): string =>
  parseFloat(formatEther(wei)).toFixed(4);

let latestBlockRef: { number: bigint; timestamp: bigint } | null = null;

export async function getBlockNumber(): Promise<bigint> {
  return await publicClient.getBlockNumber();
}

async function refreshBlockRef(): Promise<void> {
  const block = await publicClient.getBlock({ blockTag: 'latest' });
  latestBlockRef = { number: block.number!, timestamp: block.timestamp };
}

export async function blockToDate(blockNumber: bigint): Promise<Date> {
  if (!latestBlockRef) await refreshBlockRef();
  const ref = latestBlockRef!;
  const diff = Number(blockNumber - ref.number);
  const timestampMs = (Number(ref.timestamp) + diff * 5) * 1000;
  return new Date(timestampMs);
}

export function formatBlockDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const formatAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const getConnectedAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tasky_address');
};

export const connectWallet = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) { alert('Please install MetaMask'); return null; }
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
  localStorage.setItem('tasky_address', address);
  return address;
};

export const disconnectWallet = (): void => {
  localStorage.removeItem('tasky_address');
};

export const getWalletBalance = async (address: string): Promise<bigint> => {
  try {
    return await publicClient.getBalance({ address: address as `0x${string}` });
  } catch { return 0n; }
};

export const getGDBalance = async (address: string): Promise<bigint> => {
  try {
    const bal = await publicClient.readContract({
      address: CONTRACTS.GDollar,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return bal as bigint;
  } catch { return 0n; }
};

export async function getBounty(id: number): Promise<Bounty | null> {
  try {
    const b = await publicClient.readContract({
      address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
      functionName: 'bounties', args: [BigInt(id)],
    }) as any;
    return {
      id, poster: b[0], title: b[1], description: b[2],
      reward: b[3], currency: b[4], deadline: b[5], status: b[6],
      worker: b[7], proof: b[8], createdAt: b[9], referrer: b[10],
    };
  } catch { return null; }
}

export async function getAllBounties(): Promise<Bounty[]> {
  try {
    const ids = await publicClient.readContract({
      address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
      functionName: 'getActiveBounties',
    }) as bigint[];
    const results = await Promise.allSettled(ids.map(id => getBounty(Number(id))));
    return results.filter(r => r.status === 'fulfilled' && r.value).map(r => (r as any).value);
  } catch { return []; }
}
