import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllBounties, type Bounty, formatCELO, blockToDate, formatBlockDate } from '../lib/celo';
import { useWallet } from '../context/WalletContext';

const statusLabels = ['Open', 'Claimed', 'Completed', 'Cancelled'];
const statusColors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-slate-400'];

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [dates, setDates] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'CELO' | 'G$'>('all');
  const { address, connect } = useWallet();

  const load = async () => {
    setLoading(true);
    const bs = await getAllBounties();
    setBounties(bs);
    const dateMap: Record<number, string> = {};
    for (const b of bs) {
      dateMap[b.id] = formatBlockDate(await blockToDate(b.deadline));
    }
    setDates(dateMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = bounties.filter(b => {
    if (filter === 'CELO') return b.currency === 0;
    if (filter === 'G$') return b.currency === 1;
    return true;
  });

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-serif font-bold text-6xl md:text-7xl tracking-tighter text-text-main mb-4">
            Find <span className="italic text-accent-indigo">Tasks</span>
            <br />
            Earn <span className="italic text-accent-emerald">G$</span>
          </h1>
          <p className="text-xl text-text-dim max-w-2xl mx-auto mb-8">
            Complete bounties, get paid in CELO or G$. No middlemen. Your proof, your reward.
          </p>
          <div className="flex items-center justify-center gap-4">
            {!address ? (
              <button onClick={connect} className="btn-primary text-lg px-10">
                Connect Wallet to Start
              </button>
            ) : (
              <Link to="/post" className="btn-primary text-lg px-10 inline-flex items-center gap-2">
                Post a Bounty
              </Link>
            )}
            <Link to="/my-bounties" className="btn-secondary text-lg px-8">
              My Bounties
            </Link>
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-serif font-bold">
            Open Bounties <span className="text-text-pale text-xl">({filtered.length})</span>
          </h2>
          <div className="flex gap-2">
            {(['all', 'CELO', 'G$'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f ? 'bg-accent-indigo text-white' : 'bg-white border border-app-border text-text-dim hover:border-accent-indigo/30'
                }`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card-premium animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-full mb-3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl text-text-dim">No open bounties{filter !== 'all' ? ` in ${filter}` : ''}</p>
            {address && <Link to="/post" className="btn-primary mt-6 inline-block">Post the first one!</Link>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bounty, i) => (
              <motion.div key={bounty.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/bounty/${bounty.id}`} className="block card-premium group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[bounty.status]}`}>
                      {statusLabels[bounty.status]}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-accent-indigo">
                      {formatCELO(bounty.reward)} {bounty.currency === 0 ? 'CELO' : 'G$'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-text-main group-hover:text-accent-indigo transition-colors mb-2 line-clamp-1">
                    {bounty.title}
                  </h3>
                  <p className="text-sm text-text-dim line-clamp-2 mb-4">{bounty.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-pale">
                    <span>#{bounty.id}</span>
                    <span>Deadline: {dates[bounty.id] || '...'}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
