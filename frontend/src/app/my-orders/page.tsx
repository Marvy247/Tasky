'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TestnetBanner from '@/components/TestnetBanner';
import { getPurchaseHistory, formatAddress } from '@/lib/celo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ExternalLink, Clock, ShoppingBag, Info, CheckCircle2 } from 'lucide-react';

export default function MyOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState(getPurchaseHistory());

  useEffect(() => {
    setOrders(getPurchaseHistory());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-green-50/20 dark:from-slate-950 dark:to-slate-900">
      <TestnetBanner /><Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent mb-2">My Orders</h1>
          <p className="text-slate-500 dark:text-slate-400">Items you have purchased on the marketplace</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg mb-6">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            When you purchase an item, your payment is sent directly to the seller via smart contract.
            Each order has a verifiable transaction on the Celo blockchain. Contact the seller to arrange delivery.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg">
            <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold mb-2">No orders yet</h3>
            <p className="text-slate-500 mb-6">Browse the marketplace to find something to buy.</p>
            <Button onClick={() => router.push('/marketplace')}
              className="bg-gradient-to-r from-yellow-500 to-green-500 text-white border-0">
              Go to Marketplace
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <Card key={`${order.txHash}-${idx}`} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">{order.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{order.description}</p>
                    </div>
                    <Badge className="bg-green-500">Purchased</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Price Paid</p>
                      <p className="font-medium">{order.price} {order.currency}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Paid To (Seller)</p>
                      <p className="font-mono text-xs">{formatAddress(order.seller)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Purchase Date</p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Transaction</p>
                      <a
                        href={`https://explorer.celo.org/mainnet/tx/${order.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700"
                      >
                        View on Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>
                      {order.currency} payment confirmed on-chain. <a
                        href={`https://explorer.celo.org/mainnet/tx/${order.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="underline text-yellow-600"
                      >Verify on Celo Explorer</a>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
