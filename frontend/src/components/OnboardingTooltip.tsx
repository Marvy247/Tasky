import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'tasky_onboarded_v2';

export default function OnboardingTooltip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ duration: 0.25 }}
            className="bg-white dark:bg-app-card rounded-3xl border border-app-border shadow-floating w-full max-w-sm p-6 text-center">
            <span className="text-4xl block mb-3">👋</span>
            <h3 className="font-bold text-lg text-text-main mb-2">Welcome to Tasky!</h3>
            <p className="text-sm text-text-dim mb-6 leading-relaxed">
              Post bounties funded with CELO or G$, or complete tasks to earn rewards.
              Funds are held in escrow — safe and transparent.
            </p>
            <div className="space-y-2 text-left mb-6">
              {[
                { icon: '📌', text: 'Post a bounty with reward + deadline' },
                { icon: '👋', text: 'Workers claim and submit proof' },
                { icon: '✅', text: 'Approve to release payment from escrow' },
                { icon: '💰', text: 'Earn in CELO or G$' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-text-dim">
                  <span className="text-base">{t.icon}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
            <button onClick={dismiss}
              className="w-full py-3.5 rounded-xl bg-accent-indigo text-white font-semibold text-sm hover:bg-accent-indigo-hover transition-colors cursor-pointer">
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
