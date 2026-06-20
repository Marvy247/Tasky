import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';
import { getBounty, type Bounty, CONTRACTS, BOUNTYBOARD_ABI, publicClient, formatCELO, formatAddress, connectWallet, blockToDate, formatBlockDate } from '../lib/celo';
import { useWallet } from '../context/WalletContext';

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
  const [deadlineDate, setDeadlineDate] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [proof, setProof] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const b = await getBounty(parseInt(id));
    setBounty(b);
    if (b) {
      setDeadlineDate(formatBlockDate(await blockToDate(b.deadline)));
      setCreatedDate(formatBlockDate(await blockToDate(b.createdAt)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const ensureConnected = async (): Promise<string | null> => {
    if (address) return address;
    const addr = await connectWallet();
    if (addr) { await refresh(); return addr; }
    return null;
  };

  const handleClaim = async () => {
    const addr = await ensureConnected();
    if (!addr || !bounty) return;
    setActionLoading(true);
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'claimBounty', args: [BigInt(bounty.id)],
        account: addr as `0x${string}`,
      });
      toast.loading('Claiming bounty...', { id: 'action' });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success('Bounty claimed! Complete the work and submit proof.', { id: 'action' });
      refresh();
      load();
    } catch (e: any) {
      toast.error(e.shortMessage || 'Claim failed', { id: 'action' });
    } finally { setActionLoading(false); }
  };

  const handleSubmitProof = async () => {
    const addr = await ensureConnected();
    if (!addr || !bounty || !proof.trim()) return;
    setActionLoading(true);
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'submitProof', args: [BigInt(bounty.id), proof.trim()],
        account: addr as `0x${string}`,
      });
      toast.loading('Submitting proof...', { id: 'action' });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success('Proof submitted! Waiting for poster to approve.', { id: 'action' });
      load();
    } catch (e: any) {
      toast.error(e.shortMessage || 'Submit failed', { id: 'action' });
    } finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    const addr = await ensureConnected();
    if (!addr || !bounty) return;
    setActionLoading(true);
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'approveSubmission', args: [BigInt(bounty.id)],
        account: addr as `0x${string}`,
      });
      toast.loading('Approving submission...', { id: 'action' });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success('Payment released! 🎉', { id: 'action' });
      refresh();
      load();
    } catch (e: any) {
      toast.error(e.shortMessage || 'Approve failed', { id: 'action' });
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    const addr = await ensureConnected();
    if (!addr || !bounty) return;
    setActionLoading(true);
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.BountyBoard, abi: BOUNTYBOARD_ABI,
        functionName: 'cancelBounty', args: [BigInt(bounty.id)],
        account: addr as `0x${string}`,
      });
      toast.loading('Cancelling...', { id: 'action' });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success('Bounty cancelled.', { id: 'action' });
      load();
    } catch (e: any) {
      toast.error(e.shortMessage || 'Cancel failed', { id: 'action' });
    } finally { setActionLoading(false); }
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
      <p className="text-5xl mb-4">🤷</p>
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
      className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all disabled:opacity-50 ${color}`}>
      {actionLoading ? 'Processing...' : label}
    </button>
  );

  return (
    <div className="pt-40 pb-24 px-6">
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
                <p className="mt-0.5">{deadlineDate}</p>
              </div>
              <div>
                <p className="text-text-pale text-xs">Created</p>
                <p className="mt-0.5">{createdDate}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-text-main mb-2">Description</h3>
              <p className="text-text-dim whitespace-pre-wrap leading-relaxed">{bounty.description}</p>
            </div>

            {bounty.referrer !== '0x0000000000000000000000000000000000000000' && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
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
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-medium text-blue-700 mb-1">Submitted Proof</p>
                <p className="text-sm text-blue-800 break-words">{bounty.proof}</p>
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
                  className="btn-primary w-full">
                  {actionLoading ? 'Submitting...' : 'Submit Proof'}
                </button>
              </div>
            )}

            {canApprove && (
              <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="font-semibold text-emerald-800 mb-2">Review Work</h3>
                <p className="text-sm text-emerald-700 mb-4">
                  The worker has submitted their proof. Approve to release {formatCELO(bounty.reward)} {currencyLabel} from escrow.
                </p>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="w-full py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-accent-indigo to-accent-emerald disabled:opacity-50 transition-all">
                  {actionLoading ? 'Processing...' : `Approve & Release Payment`}
                </button>
              </div>
            )}

            {bounty.status === 2 && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-emerald-700 font-medium">✅ Bounty completed! Payment released to worker.</p>
              </div>
            )}
            {bounty.status === 3 && (
              <div className="mt-6 p-4 bg-slate-100 rounded-xl text-center">
                <p className="text-slate-500 font-medium">Bounty cancelled. Funds returned to poster.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
