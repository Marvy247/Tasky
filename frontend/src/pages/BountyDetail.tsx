import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';
import { getBounty, blockToEta, type Bounty, CONTRACTS, BOUNTYBOARD_ABI, publicClient, formatCELO, formatAddress, connectWallet } from '../lib/celo';
import { useWallet } from '../context/WalletContext';
import Countdown from '../components/Countdown';
import Confetti from '../components/Confetti';
import TransactionModal from '../components/TransactionModal';
import type { Step } from '../components/TransactionModal';

async function getWalletClient() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No wallet');
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

const statusLabels = ['Open', 'Claimed', 'Completed', 'Cancelled'];
const statusColors = ['bg-emerald-500 text-white', 'bg-amber-500 text-white', 'bg-blue-500 text-white', 'bg-slate-400 text-white'];

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, refresh } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [deadlineTs, setDeadlineTs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [proof, setProof] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSteps, setModalSteps] = useState<Step[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const b = await getBounty(parseInt(id));
    setBounty(b);
    if (b) setDeadlineTs(await blockToEta(b.deadline));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const ensureConnected = async (): Promise<string | null> => {
    if (address) return address;
    const addr = await connectWallet();
    if (addr) { await refresh(); return addr; }
    return null;
  };

  const runAction = async (label: string, action: () => Promise<void>, onSuccess?: () => void) => {
    const addr = await ensureConnected();
    if (!addr || !bounty) return;
    setActionLoading(true);
    const steps: Step[] = [{ label, status: 'active' }, { label: 'Confirmed', status: 'pending' }];
    setModalTitle(label);
    setModalSteps(steps);
    setModalOpen(true);
    try {
      await action();
      setModalSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s));
      setModalSteps(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'done' } : s));
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setModalSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
      toast.error(e.shortMessage || `${label} failed`);
    } finally { setActionLoading(false); }
  };

  const handleClaim = async () => {
    if (!bounty) return;
    await runAction('Claiming Bounty', async () => {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'claimBounty', args: [BigInt(bounty.id)],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      refresh();
      load();
    });
  };

  const handleSubmitProof = async () => {
    if (!bounty || !proof.trim()) return;
    await runAction('Submitting Proof', async () => {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'submitProof', args: [BigInt(bounty.id), proof.trim()],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      load();
    });
  };

  const handleApprove = async () => {
    if (!bounty) return;
    await runAction('Approving & Releasing', async () => {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'approveSubmission', args: [BigInt(bounty.id)],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      refresh();
      load();
    });
  };

  const handleCancel = async () => {
    if (!bounty) return;
    await runAction('Cancelling Bounty', async () => {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'cancelBounty', args: [BigInt(bounty.id)],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      load();
    });
  };

  const handleShare = () => {
    const ref = address || '';
    const url = `${window.location.origin}/bounty/${id}${ref ? `?ref=${ref}` : ''}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied! Share it with a friend.');
  };

  if (loading) return (
    <div className="pt-40 pb-24 px-6">
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-200 rounded" />
      </div>
    </div>
  );

  if (!bounty) return (
    <div className="pt-40 pb-24 px-6 text-center">
      <svg className="w-16 h-16 mx-auto mb-6 text-text-pale" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
        <circle cx="32" cy="32" r="28" strokeDasharray="4 3" />
        <path d="M32 20v14l8 4" strokeLinecap="round" />
      </svg>
      <h2 className="text-2xl font-bold mb-2">Bounty not found</h2>
      <button onClick={() => navigate('/')} className="btn-primary mt-4">Back to Home</button>
    </div>
  );

  const isPoster = address?.toLowerCase() === bounty.poster.toLowerCase();
  const isWorker = address?.toLowerCase() === bounty.worker.toLowerCase();
  const canClaim = bounty.status === 0 && !isPoster && !!address;
  const canSubmitProof = bounty.status === 1 && isWorker;
  const canApprove = bounty.status === 1 && isPoster;
  const canCancel = (bounty.status === 0 || (bounty.status === 1 && isPoster)) && isPoster;

  const currencyLabel = bounty.currency === 0 ? 'CELO' : 'G$';

  const ActionButton = ({ onClick, label, color }: { onClick: () => void; label: string; color: string }) => (
    <button onClick={onClick} disabled={actionLoading}
      className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all disabled:opacity-50 cursor-pointer ${color}`}>
      {actionLoading ? 'Processing...' : label}
    </button>
  );

  return (
    <div className="pt-40 pb-24 px-6">
      <Confetti active={showConfetti} />
      <TransactionModal open={modalOpen} title={modalTitle} steps={modalSteps}
        onClose={() => { setModalOpen(false); load(); }} />
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost mb-6">← Back</button>

          <div className="card-premium">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[bounty.status]}`}>
                  {statusLabels[bounty.status]}
                </span>
                <h1 className="font-serif font-bold text-4xl mt-3 text-text-main">{bounty.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold bg-gradient-to-r from-accent-indigo to-accent-emerald bg-clip-text text-transparent">
                  {formatCELO(bounty.reward)} {currencyLabel}
                </p>
                <p className="text-xs text-text-pale mt-1">reward</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-app-hover rounded-xl text-sm">
              <div>
                <p className="text-text-pale text-xs">Poster</p>
                <p className="font-mono text-xs mt-0.5">{formatAddress(bounty.poster)}</p>
              </div>
              <div>
                <p className="text-text-pale text-xs">Worker</p>
                <p className="font-mono text-xs mt-0.5">{bounty.worker === '0x0000000000000000000000000000000000000000' ? '—' : formatAddress(bounty.worker)}</p>
              </div>
              <div>
                <p className="text-text-pale text-xs">Deadline</p>
                <p className="mt-0.5">{deadlineTs > 0 ? <Countdown targetTimestamp={deadlineTs} /> : '...'}</p>
              </div>
              <div>
                <p className="text-text-pale text-xs">Bounty</p>
                <p className="mt-0.5">#{bounty.id}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-text-main mb-2">Description</h3>
              <p className="text-text-dim whitespace-pre-wrap leading-relaxed">{bounty.description}</p>
            </div>

            {bounty.referrer !== '0x0000000000000000000000000000000000000000' && (
              <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                Referrer: {formatAddress(bounty.referrer)} — they get 0.5% when completed.
              </div>
            )}

            {bounty.status === 0 && (
              <div className="mb-6 p-4 bg-app-hover rounded-xl text-sm text-text-dim">
                <p className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  Funds held in escrow. {canClaim ? 'Claim this bounty to start working.' : isPoster ? 'Waiting for a worker to claim.' : 'Connect wallet to claim.'}
                </p>
              </div>
            )}

            {bounty.proof && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Submitted Proof</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 break-words">{bounty.proof}</p>
              </div>
            )}

            <div className="space-y-3">
              {canClaim && <ActionButton onClick={handleClaim} label="Claim Bounty" color="bg-gradient-to-r from-accent-indigo to-accent-emerald" />}
              {canCancel && <ActionButton onClick={handleCancel} label="Cancel Bounty" color="bg-red-500" />}
            </div>

            {canSubmitProof && (
              <div className="mt-6 p-6 bg-app-hover rounded-xl border border-app-border">
                <h3 className="font-semibold text-text-main mb-3">Submit Proof of Work</h3>
                <textarea className="input-premium min-h-[100px] mb-3" placeholder="IPFS hash, link to deliverable, or description of completed work..."
                  value={proof} onChange={e => setProof(e.target.value)} />
                <button onClick={handleSubmitProof} disabled={actionLoading || !proof.trim()}
                  className="btn-primary w-full cursor-pointer">
                  {actionLoading ? 'Submitting...' : 'Submit Proof'}
                </button>
              </div>
            )}

            {canApprove && (
              <div className="mt-6 p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-2">Review Work</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                  The worker has submitted their proof. Approve to release {formatCELO(bounty.reward)} {currencyLabel} from escrow.
                </p>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="w-full py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-accent-indigo to-accent-emerald disabled:opacity-50 transition-all cursor-pointer">
                  {actionLoading ? 'Processing...' : `Approve & Release Payment`}
                </button>
              </div>
            )}

            {bounty.status === 2 && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-center">
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">✅ Bounty completed! Payment released to worker.</p>
              </div>
            )}

            {bounty.status === 3 && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-500/10 rounded-xl text-center">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Bounty cancelled. Funds returned to poster.</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between text-sm text-text-dim border-t border-app-border pt-6">
              <button onClick={handleShare} className="flex items-center gap-2 hover:text-accent-indigo transition-colors cursor-pointer">
                <span>🔗</span> Share with Referral Link
              </button>
              <span className="text-xs text-text-pale">2.5% platform fee · 0.5% referral bonus</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
