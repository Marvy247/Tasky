import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllBounties, getRecentActivity, getStats, blockToEta, timeAgo, type Bounty, type ActivityItem, formatCELO } from '../lib/celo';
import { useWallet } from '../context/WalletContext';
import Countdown from '../components/Countdown';

const statusLabels = ['Open', 'Claimed', 'Completed', 'Cancelled'];
const statusColors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-slate-400'];

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [deadlines, setDeadlines] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'CELO' | 'G$'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'reward' | 'deadline'>('newest');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({ totalBounties: 0, accumulatedFees: 0n });
  const { address, connect } = useWallet();

  const load = async () => {
    setLoading(true);
    const [bs, act, st] = await Promise.all([
      getAllBounties(),
      getRecentActivity(10),
      getStats(),
    ]);
    setBounties(bs);
    setActivity(act);
    setStats(st);
    const dm: Record<number, number> = {};
    for (const b of bs) dm[b.id] = await blockToEta(b.deadline);
    setDeadlines(dm);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = bounties
    .filter(b => {
      if (filter === 'CELO') return b.currency === 0;
      if (filter === 'G$') return b.currency === 1;
      return true;
    })
    .filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'reward') return Number(b.reward - a.reward);
      if (sort === 'deadline') return Number(a.deadline - b.deadline);
      return Number(b.id - a.id);
    });

  const activityColors: Record<string, string> = {
    posted: 'border-l-emerald-400 bg-emerald-50/50',
    claimed: 'border-l-amber-400 bg-amber-50/50',
    completed: 'border-l-blue-400 bg-blue-50/50',
    cancelled: 'border-l-slate-400 bg-slate-50/50',
  };
  const activityIcons: Record<string, string> = { posted: '📢', claimed: '👋', completed: '✅', cancelled: '🗑️' };
  const activityVerbs: Record<string, string> = { posted: 'Posted', claimed: 'Claimed', completed: 'Completed', cancelled: 'Cancelled' };

  const grouped = activity.reduce<Record<string, ActivityItem[]>>((acc, a) => {
    const day = new Date(a.timestamp * 1000).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const label = day === today ? 'Today' : day === yesterday ? 'Yesterday' : new Date(a.timestamp * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    if (!acc[label]) acc[label] = [];
    acc[label].push(a);
    return acc;
  }, {});

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
          <div className="flex items-center justify-center gap-4 flex-wrap">
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

        {stats.totalBounties > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Bounties', value: stats.totalBounties.toString(), icon: '📋' },
              { label: 'Open Now', value: bounties.length.toString(), icon: '🔓' },
              { label: 'Reward Pool', value: `${formatCELO(bounties.reduce((a, b) => a + b.reward, 0n))} CELO`, icon: '💰' },
              { label: 'Fees Accumulated', value: `${formatCELO(stats.accumulatedFees)} CELO`, icon: '📊' },
            ].map((s, i) => (
              <div key={i} className="card-premium !p-5 flex items-center gap-4">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-text-pale">{s.label}</p>
                  <p className="text-lg font-bold text-text-main">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-serif font-bold shrink-0">
            Open Bounties <span className="text-text-pale text-xl">({filtered.length})</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input className="input-premium !py-2.5 !px-4 text-sm min-w-[200px]" placeholder="Search bounties..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2">
              <select value={sort} onChange={e => setSort(e.target.value as any)}
                className="input-premium !py-2.5 !px-3 text-sm !w-auto !min-w-0">
                <option value="newest">Newest</option>
                <option value="reward">Highest Reward</option>
                <option value="deadline">Deadline</option>
              </select>
              {(['all', 'CELO', 'G$'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === f ? 'bg-accent-indigo text-white' : 'bg-white border border-app-border text-text-dim hover:border-accent-indigo/30'
                  }`}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card-premium animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-full mb-3" />
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl text-text-dim">
              {search ? 'No bounties match your search' : `No open bounties${filter !== 'all' ? ` in ${filter}` : ''}`}
            </p>
            {address && !search && <Link to="/post" className="btn-primary mt-6 inline-block">Post the first one!</Link>}
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
                    {deadlines[bounty.id] && <Countdown targetTimestamp={deadlines[bounty.id]} />}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {activity.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-text-main">Activity</h3>
              <span className="text-xs text-text-pale font-mono">{activity.length} events</span>
            </div>
            <div className="space-y-6">
              {Object.entries(grouped).map(([label, items]) => (
                <div key={label}>
                  <p className="text-[11px] uppercase tracking-widest text-text-pale font-medium mb-3 px-1">{label}</p>
                  <div className="space-y-1.5">
                    {items.map((a, i) => (
                      <Link key={`${label}-${i}`} to={`/bounty/${a.bountyId}`}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border-l-4 transition-all hover:shadow-sm group ${activityColors[a.type]}`}>
                        <span className="text-base mt-0.5 shrink-0">{activityIcons[a.type]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-main leading-snug">
                            <span className="font-medium">{activityVerbs[a.type]}</span>
                            <span className="text-text-pale"> on </span>
                            <span className="font-medium group-hover:text-accent-indigo transition-colors">{a.title}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-pale font-mono">{timeAgo(a.timestamp)}</span>
                            <span className="text-xs text-text-pale">·</span>
                            <span className="text-xs font-medium text-accent-indigo">{formatCELO(a.reward)} {a.currency === 0 ? 'CELO' : 'G$'}</span>
                            <span className="text-xs text-text-pale">·</span>
                            <span className="text-xs text-text-pale font-mono">{a.address?.slice(0, 6)}…</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
