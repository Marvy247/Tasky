import { motion, AnimatePresence } from 'framer-motion';

export interface Step {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export default function TransactionModal({
  open, title, steps, onClose,
}: {
  open: boolean;
  title: string;
  steps: Step[];
  onClose?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-app-card rounded-3xl border border-app-border shadow-floating w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-text-main">{title}</h3>
              {onClose && steps.every(s => s.status === 'done' || s.status === 'error') && (
                <button onClick={onClose} className="text-text-pale hover:text-text-dim transition-colors text-xl leading-none">&times;</button>
              )}
            </div>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                    {s.status === 'done' && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 text-lg">✓</motion.span>
                    )}
                    {s.status === 'active' && (
                      <span className="w-4 h-4 border-2 border-accent-indigo border-t-transparent rounded-full" style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                    )}
                    {s.status === 'error' && (
                      <span className="text-red-500 text-lg">✕</span>
                    )}
                    {s.status === 'pending' && (
                      <span className="w-4 h-4 rounded-full bg-app-border" />
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
                    s.status === 'done' ? 'text-text-main font-medium' :
                    s.status === 'active' ? 'text-accent-indigo font-medium' :
                    s.status === 'error' ? 'text-red-600 font-medium' :
                    'text-text-pale'
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            {steps.every(s => s.status === 'done') && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
                className="mt-6 w-full py-3 rounded-xl bg-accent-indigo text-white font-semibold text-sm hover:bg-accent-indigo-hover transition-colors cursor-pointer">
                Done
              </motion.button>
            )}
            {steps.some(s => s.status === 'error') && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
                className="mt-6 w-full py-3 rounded-xl border border-app-border text-text-dim font-semibold text-sm hover:bg-app-hover transition-colors cursor-pointer">
                Close
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
