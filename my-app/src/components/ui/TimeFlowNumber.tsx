interface TimeFlowNumberProps {
  value: string | number;
  className?: string;
  animate?: boolean;
}

export function TimeFlowNumber({ value, className = '', animate = true }: TimeFlowNumberProps) {
  const display = String(value);
  return <span key={display} className={`time-flow-number ${animate ? 'time-flow-number--animated' : ''} ${className}`}>{display}</span>;
}
