import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConnectedAddress, connectWallet as doConnect, disconnectWallet, getWalletBalance, getGDBalance, formatCELO } from '../lib/celo';

interface WalletContextType {
  address: string | null;
  celoBalance: string;
  gdBalance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null, celoBalance: '0', gdBalance: '0',
  connect: async () => {}, disconnect: () => {}, refresh: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [celoBalance, setCeloBalance] = useState('0');
  const [gdBalance, setGdBalance] = useState('0');

  const refreshBalances = async (addr: string) => {
    const [c, g] = await Promise.all([getWalletBalance(addr), getGDBalance(addr)]);
    setCeloBalance(formatCELO(c));
    setGdBalance(formatCELO(g));
  };

  useEffect(() => {
    const addr = getConnectedAddress();
    if (addr) { setAddress(addr); refreshBalances(addr); }
  }, []);

  useEffect(() => {
    if (!address) return;
    refreshBalances(address);
    const id = setInterval(() => refreshBalances(address), 15000);
    return () => clearInterval(id);
  }, [address]);

  const connect = async () => {
    const addr = await doConnect();
    if (addr) { setAddress(addr); await refreshBalances(addr); }
  };

  const disconnect = () => {
    disconnectWallet();
    setAddress(null);
    setCeloBalance('0');
    setGdBalance('0');
  };

  const refresh = async () => {
    if (address) await refreshBalances(address);
  };

  return (
    <WalletContext.Provider value={{ address, celoBalance, gdBalance, connect, disconnect, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
