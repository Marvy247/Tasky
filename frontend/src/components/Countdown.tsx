import { useState, useEffect } from 'react';

export default function Countdown({ targetTimestamp }: { targetTimestamp: number }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestamp - now;
      if (diff <= 0) { setDisplay('Expired'); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      if (d > 0) setDisplay(`${d}d ${h}h ${m}m`);
      else if (h > 0) setDisplay(`${h}h ${m}m ${s}s`);
      else if (m > 0) setDisplay(`${m}m ${s}s`);
      else setDisplay(`${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  const isExpired = display === 'Expired';
  return (
    <span className={`font-mono text-xs tabular-nums ${isExpired ? 'text-red-500' : 'text-text-pale'}`}>
      {isExpired ? 'Expired' : `${display} left`}
    </span>
  );
}
