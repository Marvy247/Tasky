'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TestnetBanner from '@/components/TestnetBanner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Listing, CONTRACTS, MARKETPLACE_ABI, GD_ABI, publicClient, formatCELO, formatAddress, getConnectedAddress, connectWallet, recordPurchase, getPurchaseHistory } from '@/lib/celo';
import { useTxTracker } from '@/lib/transactionTracker';
import { createNotification, saveNotifications, loadNotifications, NOTIF_TYPES } from '@/lib/notifications';
import { createWalletClient, custom, parseEther } from 'viem';
import { celo } from 'viem/chains';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, User, Clock, ExternalLink, Package, Info, Edit3, Trash2, Save, X, Coins, CheckCircle2 } from 'lucide-react';

async function getWalletClient() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No wallet detected');
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = Number(params.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<'CELO' | 'G$'>('CELO');
  const { addTx } = useTxTracker();

  useEffect(() => {
    const addr = getConnectedAddress();
    if (addr) setUserAddress(addr);
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    setLoading(true);
    setError('');
    try {
      const l = await publicClient.readContract({
        address: CONTRACTS.CoreMarketPlace,
        abi: MARKETPLACE_ABI,
        functionName: 'getListing',
        args: [BigInt(listingId)],
      }) as any;
      setListing({
        listingId,
        seller: l.seller,
        name: l.name,
        description: l.description,
        price: l.price,
        currency: l.currency,
        status: l.status,
        createdAt: l.createdAt,
        expiresAt: l.expiresAt,
      });
      setEditPrice(formatCELO(l.price));
      setEditDescription(l.description);
    } catch {
      setError('Listing not found');
    } finally {
      setLoading(false);
    }
  };

  const ensureConnected = async () => {
    let addr = getConnectedAddress();
    if (!addr) {
      addr = await connectWallet();
      if (addr) setUserAddress(addr);
    }
    return addr;
  };

  const alreadyBought = listing
    ? getPurchaseHistory().some(o => o.listingId === listing.listingId)
    : false;

  const handlePurchaseClick = async () => {
    const addr = await ensureConnected();
    if (!addr || !listing) return;
    const defaultCur = listing.currency === 1 ? 'G$' : 'CELO';
    setPaymentCurrency(defaultCur);
    setShowConfirm(true);
  };

  const executePurchase = async () => {
    const addr = await ensureConnected();
    if (!addr || !listing) return;
    setShowConfirm(false);
    setPurchasing(true);
    try {
      const wc = await getWalletClient();
      let hash: string;

      if (paymentCurrency === 'CELO') {
        hash = await wc.writeContract({
          address: CONTRACTS.CoreMarketPlace, abi: MARKETPLACE_ABI,
          functionName: 'purchaseListing', args: [BigInt(listingId)],
          value: listing.price, account: addr as `0x${string}`,
        });
      } else {
        const allowance = await publicClient.readContract({
          address: CONTRACTS.GDollar, abi: GD_ABI,
          functionName: 'allowance', args: [addr as `0x${string}`, CONTRACTS.CoreMarketPlace],
        });
        if (allowance < listing.price) {
          const approveHash = await wc.writeContract({
            address: CONTRACTS.GDollar, abi: GD_ABI,
            functionName: 'approve', args: [CONTRACTS.CoreMarketPlace, listing.price],
            account: addr as `0x${string}`,
          });
          addTx(approveHash, `Approve G$ for ${listing.name}`);
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
        hash = await wc.writeContract({
          address: CONTRACTS.CoreMarketPlace, abi: MARKETPLACE_ABI,
          functionName: 'purchaseListingGD', args: [BigInt(listingId)],
          account: addr as `0x${string}`,
        });
      }

      addTx(hash, `Purchase: ${listing.name}`);
      recordPurchase({
        listingId: listing.listingId,
        name: listing.name,
        description: listing.description,
        price: formatCELO(listing.price),
        currency: paymentCurrency,
        seller: listing.seller,
        txHash: hash,
        timestamp: Date.now(),
      });
      const ns = loadNotifications();
      ns.unshift(createNotification(NOTIF_TYPES.PURCHASE, `Purchased "${listing.name}" for ${formatCELO(listing.price)} ${paymentCurrency}`));
      saveNotifications(ns);
      toast.success('Purchase submitted!', {
        description: `${formatCELO(listing.price)} ${paymentCurrency} paid to seller. Track in Transactions panel.`,
        action: { label: 'View Orders', onClick: () => window.location.href = '/my-orders' },
      });
      loadListing();
    } catch (e: any) {
      toast.error(e.shortMessage ?? 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const startEditing = () => {
    if (!listing) return;
    setEditPrice(formatCELO(listing.price));
    setEditDescription(listing.description);
    setEditing(true);
  };

  const handleEdit = async () => {
    if (!listing) return;
    const addr = getConnectedAddress();
    if (!addr) return;
    setSaving(true);
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace, abi: MARKETPLACE_ABI,
        functionName: 'updateListing',
        args: [BigInt(listingId), parseEther(editPrice), editDescription],
        account: addr as `0x${string}`,
      });
      addTx(hash, `Edit listing #${listingId}`);
      const ns = loadNotifications();
      ns.unshift(createNotification(NOTIF_TYPES.LISTING, `Listing #${listingId} updated`));
      saveNotifications(ns);
      toast.success('Listing updated!');
      setEditing(false);
      loadListing();
    } catch (e: any) {
      toast.error(e.shortMessage ?? 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!listing) return;
    const addr = getConnectedAddress();
    if (!addr) return;
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.CoreMarketPlace, abi: MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
        account: addr as `0x${string}`,
      });
      addTx(hash, `Cancel listing #${listingId}`);
      const ns = loadNotifications();
      ns.unshift(createNotification(NOTIF_TYPES.LISTING, `Listing #${listingId} cancelled`));
      saveNotifications(ns);
      toast.success('Listing cancelled!');
      loadListing();
    } catch (e: any) {
      toast.error(e.shortMessage ?? 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-yellow-50/20 to-green-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <TestnetBanner /><Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-yellow-50/20 to-green-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <TestnetBanner /><Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center w-full">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Listing Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'This listing does not exist or has been removed.'}</p>
          <Link href="/marketplace"><Button>Back to Marketplace</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = listing.seller.toLowerCase() === userAddress.toLowerCase();
  const isActive = listing.status === 0;
  const currency = listing.currency === 1 ? 'G$' : 'CELO';
  const statusLabel = ['Active', 'Sold', 'Cancelled'][listing.status];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-yellow-50/20 to-green-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <TestnetBanner /><Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Link href="/marketplace" className="inline-flex items-center text-sm text-slate-500 hover:text-yellow-600 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Marketplace
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{listing.name}</h1>
              <Badge className={`${isActive ? 'bg-green-500' : listing.status === 1 ? 'bg-blue-500' : 'bg-slate-400'} shrink-0`}>
                {statusLabel}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>Seller: {formatAddress(listing.seller)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Created block #{listing.createdAt.toString()}</span>
              </div>
              {listing.expiresAt > 0n && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Expires block #{listing.expiresAt.toString()}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</h3>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent">
                  {formatCELO(listing.price)} {currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Seller receives</p>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {formatCELO(listing.price)} {currency}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg mb-6">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Your payment is sent directly to the seller via smart contract. No intermediaries, no extra fees.
                After purchase, you can track your order in <Link href="/my-orders" className="underline">My Orders</Link> and view the transaction on-chain.
              </p>
            </div>

            {alreadyBought && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg mb-6">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-300">
                  You purchased this item. View it in <Link href="/my-orders" className="underline">My Orders</Link>.
                </p>
              </div>
            )}

            {isActive && !isOwner && !alreadyBought && (
              <Button onClick={handlePurchaseClick} disabled={purchasing} size="lg"
                className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-white border-0 text-lg py-6">
                <ShoppingCart className="h-5 w-5 mr-2" />
                {purchasing ? 'Processing...' : `Buy Now — ${formatCELO(listing.price)} ${currency}`}
              </Button>
            )}

            {isActive && isOwner && !editing && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button onClick={startEditing} variant="outline" className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" /> Edit Listing
                </Button>
                <Button onClick={handleCancel} variant="destructive" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Listing
                </Button>
              </div>
            )}

            {isActive && isOwner && editing && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Price ({currency})</label>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min="0"
                    step="0.001"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEdit} disabled={saving} className="flex-1 bg-gradient-to-r from-yellow-500 to-green-500 text-white border-0">
                    <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="outline">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}

            {!isActive && (
              <p className="text-center text-sm text-slate-400">
                This item has been {listing.status === 1 ? 'sold' : 'cancelled'}.
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">On-Chain Details</h3>
              <div className="space-y-1 text-xs text-slate-500 font-mono">
                <p>Listing ID: #{listing.listingId}</p>
                <p>Seller: {listing.seller}</p>
                <p>Contract: {formatAddress(CONTRACTS.CoreMarketPlace)}</p>
                <a
                  href={`https://explorer.celo.org/mainnet/address/${CONTRACTS.CoreMarketPlace}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> View Contract on Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => { if (!open) setShowConfirm(false); }}
        title="Confirm Purchase"
        description={
          listing
            ? `You are buying "${listing.name}" for ${formatCELO(listing.price)} ${paymentCurrency}.`
            : ''
        }
        onConfirm={executePurchase}
        confirmText={`Pay ${listing ? formatCELO(listing.price) : ''} ${paymentCurrency}`}
      >
        {listing && (
          <div className="mt-4 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Item</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{listing.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{formatCELO(listing.price)} {paymentCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span>Seller</span>
                <span className="font-mono text-xs">{formatAddress(listing.seller)}</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                <Info className="h-3 w-3 inline mr-1" />
                Funds sent directly to seller. Transfer is recorded on-chain.
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                <ShoppingCart className="h-3 w-3 inline mr-1" />
                Order tracked in <Link href="/my-orders" className="underline text-yellow-600">My Orders</Link>.
              </p>
            </div>

            {listing.currency === 1 && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Pay with</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentCurrency('CELO')}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                      paymentCurrency === 'CELO'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <Coins className={`h-4 w-4 ${paymentCurrency === 'CELO' ? 'text-yellow-500' : ''}`} />
                    CELO
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentCurrency('G$')}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                      paymentCurrency === 'G$'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <Coins className={`h-4 w-4 ${paymentCurrency === 'G$' ? 'text-green-500' : ''}`} />
                    G$
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </ConfirmDialog>

      <Footer />
    </div>
  );
}
