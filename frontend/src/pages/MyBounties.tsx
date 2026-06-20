import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { publicClient, CONTRACTS, BOUNTYBOARD_ABI, blockToEta, type Bounty, formatCELO } from '../lib/celo';
import { useWallet } from '../context/WalletContext';
import Countdown from '../components/Countdown';

const statusLabels = ['Open', 'Claimed', 'Completed', 'Cancelled'];
const statusColors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-slate-400'];

export default function MyBounties() {
  const { address, connect } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [deadlines, setDeadlines] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'posted' | 'claimed'>('all');

  useEffect(() => {
    if (!address) return;
    const load = async () => {
      setLoading(true);
      const ids = await publicClient.readContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'getUserBounties',
        args: [address as `0x${string}`],
      }) as bigint[];
      const nums = ids.map(i => Number(i));
      const results = await Promise.allSettled(
        nums.map(id => publicClient.readContract({
          address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
          functionName: 'bounties', args: [BigInt(id)],
        }) as any)
      );
      const bs: Bounty[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const b = r.value;
          bs.push({ id: nums[i], poster: b[0], title: b[1], description: b[2],
            reward: b[3], currency: b[4], deadline: b[5], status: b[6],
            worker: b[7], proof: b[8], createdAt: b[9], referrer: b[10] });
        }
      });
      setBounties(bs);
      const dm: Record<number, number> = {};
      for (const b of bs) dm[b.id] = await blockToEta(b.deadline);
      setDeadlines(dm);
      setLoading(false);
    };
    load();
  }, [address]);

  const filtered = bounties.filter(b => {
    if (tab === 'posted') return b.poster.toLowerCase() === address?.toLowerCase();
    if (tab === 'claimed') return b.worker.toLowerCase() === address?.toLowerCase();
    return true;
  });

  if (!address) return (
    <div className="pt-40 pb-24 px-6 text-center">
      <p className="text-5xl mb-4">🔐</p>
      <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
      <p className="text-text-dim mb-6">Connect your wallet to view your bounties.</p>
      <button onClick={connect} className="btn-primary">Connect Wallet</button>
    </div>
  );

  const needsAction = bounties.filter(b =>
    (b.poster.toLowerCase() === address?.toLowerCase() && b.status === 1) ||
    (b.worker.toLowerCase() === address?.toLowerCase() && b.status === 0)
  ).length;

  return (
    <div className="pt-40 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif font-bold text-5xl tracking-tighter text-text-main mb-2">
            My <span className="italic text-accent-indigo">Bounties</span>
          </h1>
          <p className="text-text-dim mb-8">
            Bounties you've posted or claimed. {needsAction > 0 && (
              <span className="text-amber-600 font-medium">{needsAction} need your attention</span>
            )}
          </p>

          <div className="flex gap-2 mb-8">
            {(['all', 'posted', 'claimed'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  tab === t ? 'bg-accent-indigo text-white' : 'bg-white border border-app-border text-text-dim'
                }`}>
                {t} ({bounties.filter(b => t === 'all' ? true : t === 'posted' ? b.poster.toLowerCase() === address?.toLowerCase() : b.worker.toLowerCase() === address?.toLowerCase()).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card-premium animate-pulse h-24" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-text-dim">No bounties found</p>
              <Link to="/post" className="btn-primary mt-4 inline-block">Post your first bounty</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((b, i) => {
                const isPoster = b.poster.toLowerCase() === address?.toLowerCase();
                const needAction = (isPoster && b.status === 1) || (!isPoster && b.status === 0);
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link to={`/bounty/${b.id}`} className={`block card-premium group relative ${needAction ? 'ring-2 ring-amber-300' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${statusColors[b.status]}`}>
                              {statusLabels[b.status]}
                            </span>
                            {isPoster ? (
                              <span className="text-[10px] font-medium text-accent-indigo bg-accent-indigo/5 px-2 py-0.5 rounded-full">Poster</span>
                            ) : (
                              <span className="text-[10px] font-medium text-accent-emerald bg-accent-emerald/5 px-2 py-0.5 rounded-full">Worker</span>
                            )}
                            {needAction && (
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Action needed</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-text-main group-hover:text-accent-indigo transition-colors">{b.title}</h3>
                          <p className="text-xs text-text-dim mt-0.5 line-clamp-1">{b.description}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0 space-y-1">
                          <p className="font-bold text-accent-indigo">{formatCELO(b.reward)} {b.currency === 0 ? 'CELO' : 'G$'}</p>
                          <p className="text-xs text-text-pale">#{b.id}</p>
                          {deadlines[b.id] && <Countdown targetTimestamp={deadlines[b.id]} />}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
