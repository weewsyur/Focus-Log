interface WormholeFallbackProps {
  label: string;
  fullScreen?: boolean;
  showLogo?: boolean;
}

export function WormholeFallback({ label, fullScreen = false, showLogo = false }: WormholeFallbackProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`wormhole-fallback ${fullScreen ? 'wormhole-fallback--screen space-shell' : ''}`}
    >
      {showLogo && <img src="/logo.png" alt="" className="h-20 w-20 rounded-2xl" />}
      <span className="wormhole-spinner" aria-hidden="true" />
      {showLogo && <span className="text-xl font-bold">Focus Log</span>}
      <span className="text-sm">{label}</span>
    </div>
  );
}
