'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function TestnetBanner() {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return (
    <div className="bg-green-600 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <p className="text-sm font-medium">
          🟡 <strong>Celo Mainnet</strong> — Powered by <strong>G$</strong> and <strong>CELO</strong>. Real assets. Connect a Celo-compatible wallet.
        </p>
        <button onClick={() => setIsVisible(false)} className="absolute right-4 hover:bg-green-700 rounded p-1 transition-colors" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
