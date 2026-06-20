import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import Home from './pages/Home';
import PostBounty from './pages/PostBounty';
import BountyDetail from './pages/BountyDetail';
import MyBounties from './pages/MyBounties';

function Navigation() {
  const location = useLocation();
  const { address, connect, celoBalance, gdBalance } = useWallet();

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

          <div className="flex items-center gap-3">
            {address ? (
              <>
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="text-text-dim">
                    <span className="font-mono font-medium text-accent-indigo">{celoBalance}</span> CELO
                  </span>
                  <span className="text-text-dim">
                    <span className="font-mono font-medium text-accent-emerald">{gdBalance}</span> G$
                  </span>
                </div>
                <span className="text-xs font-mono text-text-pale bg-app-hover px-3 py-1.5 rounded-full">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </>
            ) : (
              <button onClick={connect} className="btn-primary text-sm !px-5 !py-2.5">
                Connect
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
        <div className="min-h-screen bg-app-bg grid-subtle selection:bg-accent-indigo/10 selection:text-accent-indigo pb-20 md:pb-0">
          <Navigation />
          <main className="relative">
            <AnimatedRoutes />
          </main>
          <footer className="border-t border-app-border py-12 px-6 bg-white">
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
