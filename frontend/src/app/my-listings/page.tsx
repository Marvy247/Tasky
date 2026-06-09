'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TestnetBanner from '@/components/TestnetBanner';
import ListingCard from '@/components/ListingCard';
import { ListingGridSkeleton } from '@/components/LoadingSkeleton';
import { getListings, Listing, CONTRACTS, MARKETPLACE_ABI, getConnectedAddress, connectWallet } from '@/lib/celo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';

type StatusFilter = 'all' | 'active' | 'sold' | 'cancelled';

async function getWalletClient() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No wallet detected');
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

export default function MyListings() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const addr = getConnectedAddress();
    if (!addr) { router.push('/'); return; }
    setUserAddress(addr);
    loadMyListings(addr);
  }, [router]);

  const loadMyListings = async (address: string) => {
    try {
      const all = await getListings();
      // getListings returns only active — fetch all by checking lastListingId
      setListings(all.filter(l => l.seller.toLowerCase() === address.toLowerCase()));
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId: number) => {
    try {
      const wc = await getWalletClient();
      toast.loading('Cancelling...');
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace,
        abi: MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
        account: userAddress as `0x${string}`,
      });
      toast.dismiss();
      toast.success('Listing cancelled!', { description: `Tx: ${hash.slice(0, 12)}...` });
      loadMyListings(userAddress);
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.shortMessage ?? 'Cancel failed');
    }
  };

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 0).length,
    sold: listings.filter(l => l.status === 1).length,
    cancelled: listings.filter(l => l.status === 2).length,
  };

  const filteredListings = listings.filter(l => {
    if (statusFilter === 'active') return l.status === 0;
    if (statusFilter === 'sold') return l.status === 1;
    if (statusFilter === 'cancelled') return l.status === 2;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <TestnetBanner /><Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent mb-8">My Listings</h1>
        <ListingGridSkeleton count={6} />
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-green-50/20 dark:from-slate-950 dark:to-slate-900">
      <TestnetBanner /><Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent mb-2">My Listings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your marketplace listings on Celo</p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg">
            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold mb-2">No listings yet</h3>
            <p className="text-slate-500 mb-6">Create your first listing on the marketplace.</p>
            <Button onClick={() => router.push('/marketplace')}
              className="bg-gradient-to-r from-yellow-500 to-green-500 text-white border-0">
              Go to Marketplace
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Package, label: 'Total', value: stats.total, color: 'bg-yellow-500' },
                { icon: TrendingUp, label: 'Active', value: stats.active, color: 'bg-green-500' },
                { icon: CheckCircle, label: 'Sold', value: stats.sold, color: 'bg-blue-500' },
                { icon: Clock, label: 'Cancelled', value: stats.cancelled, color: 'bg-slate-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} className="bg-white dark:bg-slate-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
                    <div className={`p-2 rounded-full ${color}`}><Icon className="h-5 w-5 text-white" /></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {(['all', 'active', 'sold', 'cancelled'] as StatusFilter[]).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {f === 'all' ? stats.total : f === 'active' ? stats.active : f === 'sold' ? stats.sold : stats.cancelled}
                  </Badge>
                </button>
              ))}
            </div>

            {filteredListings.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
                <XCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No {statusFilter} listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <ListingCard key={listing.listingId} listing={listing} onCancel={handleCancelListing} isOwner />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
