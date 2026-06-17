'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import CreateListingForm from '@/components/CreateListingForm';
import TestnetBanner from '@/components/TestnetBanner';
import { ListingGridSkeleton } from '@/components/LoadingSkeleton';
import {
  getListings, Listing, CONTRACTS, MARKETPLACE_ABI,
  getConnectedAddress, connectWallet, formatCELO
} from '@/lib/celo';
import { createWalletClient, custom, parseEther } from 'viem';
import { celo } from 'viem/chains';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Package } from 'lucide-react';

async function getWalletClient() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No wallet detected');
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  useEffect(() => {
    loadListings();
    const addr = getConnectedAddress();
    if (addr) setUserAddress(addr);
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      setListings(await getListings());
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const ensureConnected = async (): Promise<string | null> => {
    let addr = getConnectedAddress();
    if (!addr) {
      addr = await connectWallet();
      if (addr) setUserAddress(addr);
    }
    return addr;
  };

  const handleCreateListing = async (data: { name: string; description: string; price: number; duration: number }) => {
    const addr = await ensureConnected();
    if (!addr) return;
    try {
      const wc = await getWalletClient();
      toast.loading('Waiting for approval...');
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace,
        abi: MARKETPLACE_ABI,
        functionName: 'createListing',
        args: [data.name, data.description, parseEther(data.price.toString()), BigInt(data.duration)],
        account: addr as `0x${string}`,
      });
      toast.dismiss();
      toast.success('Listing created!', { description: `Tx: ${hash.slice(0, 12)}...` });
      loadListings();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.shortMessage ?? 'Failed to create listing');
    }
  };

  const handlePurchaseListing = async (listingId: number) => {
    const addr = await ensureConnected();
    if (!addr) return;
    const listing = listings.find(l => l.listingId === listingId);
    if (!listing) return;
    try {
      const wc = await getWalletClient();
      toast.loading('Processing purchase...');
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace,
        abi: MARKETPLACE_ABI,
        functionName: 'purchaseListing',
        args: [BigInt(listingId)],
        value: listing.price,
        account: addr as `0x${string}`,
      });
      toast.dismiss();
      toast.success('Purchase successful!', { description: `Tx: ${hash.slice(0, 12)}...` });
      loadListings();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.shortMessage ?? 'Purchase failed');
    }
  };

  const handleCancelListing = async (listingId: number) => {
    const addr = await ensureConnected();
    if (!addr) return;
    try {
      const wc = await getWalletClient();
      toast.loading('Cancelling...');
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace,
        abi: MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
        account: addr as `0x${string}`,
      });
      toast.dismiss();
      toast.success('Listing cancelled!', { description: `Tx: ${hash.slice(0, 12)}...` });
      loadListings();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.shortMessage ?? 'Cancel failed');
    }
  };

  const filteredListings = listings
    .filter(l => !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price - b.price);
      if (sortBy === 'price-high') return Number(b.price - a.price);
      return b.listingId - a.listingId;
    });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-yellow-50/20 to-green-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <TestnetBanner />
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent mb-2">
            Decentralized Marketplace
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Buy and sell goods securely using smart contracts on Celo
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <CreateListingForm onCreateListing={handleCreateListing} />
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search listings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <ListingGridSkeleton count={6} />
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg">
            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
              {searchQuery ? 'No listings match your search.' : 'No active listings yet.'}
            </p>
            <p className="text-sm text-slate-400 mt-1">Be the first to create a listing!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard
                key={listing.listingId}
                listing={listing}
                onPurchase={handlePurchaseListing}
                onCancel={handleCancelListing}
                isOwner={listing.seller.toLowerCase() === userAddress.toLowerCase()}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
