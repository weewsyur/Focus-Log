import { useEffect, useState } from 'react';
import './space-effects.css';

export function SpaceBackground() {
  const [paused, setPaused] = useState(() => document.visibilityState === 'hidden');

  useEffect(() => {
    const updateVisibility = () => setPaused(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  return (
    <div className="space-background" data-paused={paused} aria-hidden="true">
      <div className="space-stars space-stars--far" />
      <div className="space-stars space-stars--near" />
      <div className="space-black-hole">
        <div className="space-accretion" />
        <div className="space-core" />
      </div>
    </div>
  );
}
