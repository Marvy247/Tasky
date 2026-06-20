import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createWalletClient, custom, parseEther } from 'viem';
import { celo } from 'viem/chains';
import { CONTRACTS, BOUNTYBOARD_ABI, GD_ABI, publicClient, connectWallet } from '../lib/celo';
import { useWallet } from '../context/WalletContext';
import TransactionModal from '../components/TransactionModal';
import type { Step } from '../components/TransactionModal';

async function getWalletClient() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No wallet');
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

function estimateDate(deadlineBlocks: number): string {
  if (!deadlineBlocks || deadlineBlocks < 100) return '';
  const secs = deadlineBlocks * 5;
  const d = new Date(Date.now() + secs * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PostBounty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, refresh } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [currency, setCurrency] = useState<'CELO' | 'G$'>('CELO');
  const [deadline, setDeadline] = useState('1000');
  const [referrer, setReferrer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.startsWith('0x') && ref.length === 42) setReferrer(ref);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let addr = address;
    if (!addr) { addr = await connectWallet(); if (!addr) return; }

    const rewardWei = parseEther(reward);
    const feeBps = 250n;
    const fee = (rewardWei * feeBps) / 10000n;
    const total = rewardWei + fee;

    const isG$ = currency === 'G$';
    const newSteps: Step[] = isG$
      ? [{ label: 'Approve G$ spending', status: 'pending' }, { label: 'Post bounty', status: 'pending' }, { label: 'Confirmed', status: 'pending' }]
      : [{ label: 'Post bounty', status: 'pending' }, { label: 'Confirmed', status: 'pending' }];
    setSteps(newSteps);
    setModalOpen(true);
    setSubmitting(true);

    try {
      const wc = await getWalletClient();

      if (isG$) {
        setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'active' } : s));
        const allowance = await publicClient.readContract({
          address: CONTRACTS.GDollar, abi: GD_ABI,
          functionName: 'allowance',
          args: [addr as `0x${string}`, CONTRACTS.BountyBoard],
        }) as bigint;
        if (allowance < total) {
          const appTx = await wc.writeContract({
            address: CONTRACTS.GDollar, abi: GD_ABI,
            functionName: 'approve',
            args: [CONTRACTS.BountyBoard, total],
            account: addr as `0x${string}`,
          });
          await publicClient.waitForTransactionReceipt({ hash: appTx });
        }
        setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done' } : s));
      }

      const stepIdx = isG$ ? 1 : 0;
      setSteps(prev => prev.map((s, i) => i === stepIdx ? { ...s, status: 'active' } : s));

      const refAddr = referrer && referrer.length === 42 ? referrer as `0x${string}` : '0x0000000000000000000000000000000000000000' as `0x${string}`;
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'postBounty',
        args: [title, description, rewardWei, currency === 'G$' ? 1 : 0, BigInt(deadline), refAddr],
        value: currency === 'CELO' ? total : 0n,
        account: addr as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s));
      setSteps(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, status: 'done' } : s));

      refresh();
    } catch (e: any) {
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
      toast.error(e.shortMessage || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const deadlineBlocks = parseInt(deadline);
  const estimatedDuration = deadlineBlocks ? `${(deadlineBlocks * 5 / 3600).toFixed(1)} hours` : '—';
  const deadlineDate = estimateDate(deadlineBlocks);

  return (
    <div className="pt-40 pb-24 px-6">
      <TransactionModal open={modalOpen} title="Posting Bounty" steps={steps}
        onClose={() => { setModalOpen(false); if (steps.every(s => s.status === 'done')) navigate('/'); }} />
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost mb-6">← Back</button>

          <h1 className="font-serif font-bold text-5xl tracking-tighter text-text-main mb-2">
            Post a <span className="italic text-accent-indigo">Bounty</span>
          </h1>
          <p className="text-text-dim mb-10">
            Fund a task with CELO or G$. Funds are held in escrow — released only when you approve the work.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-dim mb-2">Title *</label>
              <input className="input-premium" placeholder="e.g. Design a logo for my startup" value={title}
                onChange={e => setTitle(e.target.value)} required maxLength={128} />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dim mb-2">Description *</label>
              <textarea className="input-premium min-h-[120px] resize-y" placeholder="Describe what needs to be done, deliverables, and any requirements..."
                value={description} onChange={e => setDescription(e.target.value)} required maxLength={1024} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-dim mb-2">Reward *</label>
                <input className="input-premium" type="number" step="0.001" min="0.001" placeholder="0.1"
                  value={reward} onChange={e => setReward(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dim mb-2">Currency</label>
                <div className="flex gap-2 h-full items-end pb-1">
                  {(['CELO', 'G$'] as const).map(c => (
                    <button key={c} type="button" onClick={() => setCurrency(c)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                        currency === c
                          ? c === 'CELO'
                            ? 'border-accent-indigo bg-accent-indigo/5 text-accent-indigo'
                            : 'border-accent-emerald bg-accent-emerald/5 text-accent-emerald'
                          : 'border-app-border text-text-dim hover:border-app-border/60'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dim mb-2">
                Deadline (blocks) * <span className="text-text-pale">≈ {estimatedDuration}{deadlineDate ? ` · ${deadlineDate}` : ''}</span>
              </label>
              <input className="input-premium" type="number" min="100" placeholder="1000"
                value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dim mb-2">
                Referrer address <span className="text-text-pale">(optional — they get 0.5% bonus)</span>
              </label>
              <input className="input-premium" placeholder="0x..." value={referrer}
                onChange={e => setReferrer(e.target.value)} />
            </div>

            {reward && parseFloat(reward) > 0 && (
              <div className="bg-app-hover rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between text-text-dim">
                  <span>Reward</span>
                  <span className="font-medium text-text-main">{reward} {currency}</span>
                </div>
                <div className="flex justify-between text-text-dim">
                  <span>Platform fee (2.5%)</span>
                  <span className="font-medium text-text-main">{(parseFloat(reward) * 0.025).toFixed(4)} {currency}</span>
                </div>
                <hr className="border-app-border my-1" />
                <div className="flex justify-between font-semibold text-text-main">
                  <span>Total from wallet</span>
                  <span>{(parseFloat(reward) * 1.025).toFixed(4)} {currency}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || !address}
              className="btn-primary w-full text-lg py-4">
              {submitting ? 'Posting...' : `Post Bounty — ${reward || '0'} ${currency}`}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
