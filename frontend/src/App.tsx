import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import Home from './pages/Home';
import PostBounty from './pages/PostBounty';
import BountyDetail from './pages/BountyDetail';
import MyBounties from './pages/MyBounties';
import OnboardingTooltip from './components/OnboardingTooltip';

function Navigation() {
  const location = useLocation();
  const { address, connect, disconnect, celoBalance, gdBalance, refresh } = useWallet();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('tasky_theme');
    if (!stored) return false;
    return stored === 'dark';
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tasky_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const links = [
    { to: '/', label: 'Browse', icon: '🔍' },
    { to: '/post', label: 'Post', icon: '📌' },
    { to: '/my-bounties', label: 'My Bounties', icon: '📋' },
  ];

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="glass rounded-2xl px-6 py-4 border border-app-border shadow-floating flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <span className="font-serif font-bold text-2xl tracking-tighter text-text-main group-hover:text-accent-indigo transition-colors duration-300">
              <span className="italic">Task</span>y
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === l.to ? 'bg-accent-indigo text-white' : 'text-text-dim hover:text-accent-indigo'
              }`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2" ref={ref}>
            <button onClick={() => setDark(!dark)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-text-pale hover:text-accent-indigo hover:bg-app-hover transition-all text-lg cursor-pointer"
              title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? '☀️' : '🌙'}
            </button>

            {address ? (
              <div className="relative">
                <button onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 bg-app-hover hover:bg-app-border transition-colors px-4 py-2 rounded-full text-sm font-mono text-text-main cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {address.slice(0, 6)}...{address.slice(-4)}
                  <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-xs text-text-pale">▼</motion.span>
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-app-card rounded-2xl border border-app-border shadow-floating p-4 space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-pale font-medium mb-1.5">Connected Wallet</p>
                        <div className="flex items-center justify-between bg-app-hover rounded-xl px-3 py-2.5">
                          <span className="font-mono text-sm text-text-main">{address.slice(0, 6)}...{address.slice(-4)}</span>
                          <button onClick={() => { navigator.clipboard.writeText(address); toast.success('Address copied'); }}
                            className="text-xs text-accent-indigo hover:text-accent-indigo-hover font-medium transition-colors cursor-pointer">
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-app-hover rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-text-pale font-medium">CELO</p>
                            <button onClick={() => refresh()} className="text-text-pale hover:text-accent-indigo transition-colors text-xs cursor-pointer" title="Refresh">↻</button>
                          </div>
                          <p className="font-bold text-sm text-accent-indigo mt-0.5">{celoBalance}</p>
                        </div>
                        <div className="bg-app-hover rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-text-pale font-medium">G$</p>
                            <button onClick={() => refresh()} className="text-text-pale hover:text-accent-emerald transition-colors text-xs cursor-pointer" title="Refresh">↻</button>
                          </div>
                          <p className="font-bold text-sm text-accent-emerald mt-0.5">{gdBalance}</p>
                        </div>
                      </div>
                      <Link to="/my-bounties" onClick={() => setOpen(false)}
                        className="flex items-center gap-2 text-sm text-text-dim hover:text-text-main transition-colors py-2 px-1">
                        📋 My Bounties
                      </Link>
                      <button onClick={() => { disconnect(); setOpen(false); }}
                        className="w-full text-sm text-red-500 hover:text-red-600 font-medium py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer">
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={connect} className="btn-primary text-sm !px-5 !py-2.5">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass rounded-t-2xl border-t border-app-border shadow-floating px-4 py-2">
          <div className="flex items-center justify-around">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all ${
                location.pathname === l.to ? 'text-accent-indigo' : 'text-text-pale'
              }`}>
                <span className="text-lg">{l.icon}</span>
                <span className="text-[10px] font-medium">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<PostBounty />} />
        <Route path="/bounty/:id" element={<BountyDetail />} />
        <Route path="/my-bounties" element={<MyBounties />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
        }} />
        <div className="min-h-screen bg-app-bg grid-subtle selection:bg-accent-indigo/10 selection:text-accent-indigo pb-20 md:pb-0 transition-colors duration-300">
          <Navigation />
          <main className="relative">
            <AnimatedRoutes />
          </main>
          <OnboardingTooltip />
          <footer className="border-t border-app-border py-12 px-6 bg-white dark:bg-app-surface transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="font-serif font-bold text-xl tracking-tighter text-text-main">
                <span className="italic">Task</span>y
              </span>
              <p className="text-xs text-text-pale">
                Decentralized bounties on Celo. Pay with CELO or G$.
              </p>
              <p className="text-xs text-text-pale">© 2026 Tasky</p>
            </div>
          </footer>
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
