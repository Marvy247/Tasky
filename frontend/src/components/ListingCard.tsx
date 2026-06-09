'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Listing, formatCELO, formatAddress } from '@/lib/celo';
import { ShoppingCart, Clock, User } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onPurchase?: (listingId: number) => void;
  onCancel?: (listingId: number) => void;
  isOwner?: boolean;
}

const CURRENCY_LABELS = ['CELO', 'G$'];
const STATUS_LABELS = ['Active', 'Sold', 'Cancelled'];

export default function ListingCard({ listing, onPurchase, onCancel, isOwner }: ListingCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handlePurchase = async () => {
    if (!onPurchase) return;
    setIsPurchasing(true);
    try { await onPurchase(listing.listingId); } finally { setIsPurchasing(false); }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsCancelling(true);
    try { await onCancel(listing.listingId); } finally { setIsCancelling(false); }
  };

  const isActive = listing.status === 0;
  const currency = CURRENCY_LABELS[listing.currency] ?? 'CELO';

  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 text-slate-900 dark:text-white">{listing.name}</CardTitle>
          <Badge className={isActive ? 'bg-green-500' : 'bg-slate-400'}>{STATUS_LABELS[listing.status]}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <User className="h-3 w-3" />
          <span>{formatAddress(listing.seller)}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 line-clamp-3">{listing.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent">
            {formatCELO(listing.price)} {currency}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>Block #{listing.expiresAt.toString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        {isOwner && isActive && (
          <Button onClick={handleCancel} disabled={isCancelling} variant="destructive" className="w-full" size="sm">
            {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
          </Button>
        )}
        {!isOwner && isActive && (
          <Button onClick={handlePurchase} disabled={isPurchasing}
            className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-white border-0">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isPurchasing ? 'Purchasing...' : `Buy with ${currency}`}
          </Button>
        )}
        {!isActive && (
          <p className="w-full text-center text-sm text-slate-400">{STATUS_LABELS[listing.status]}</p>
        )}
      </CardFooter>
    </Card>
  );
}
