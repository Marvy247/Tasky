import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speed: number;
}

const COLORS = ['#4F46E5', '#059669', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const p: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      speed: 0.5 + Math.random() * 0.8,
    }));
    setParticles(p);
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y + p.speed * 1.5,
        x: p.x + (Math.random() - 0.5) * 1.5,
        rotation: p.rotation + 5,
      })).filter(p => p.y < 110));
    }, 30);
    setTimeout(() => { clearInterval(interval); setParticles([]); }, 4000);
    return () => clearInterval(interval);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute" style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size * 0.6,
          background: p.color,
          borderRadius: '2px',
          transform: `rotate(${p.rotation}deg)`,
          opacity: 1 - (p.y > 80 ? (p.y - 80) / 30 : 0),
        }} />
      ))}
    </div>
  );
}
