interface TimeFlowNumberProps {
  value: string | number;
  className?: string;
}

export function TimeFlowNumber({ value, className = '' }: TimeFlowNumberProps) {
  const display = String(value);
  return <span key={display} className={`time-flow-number ${className}`}>{display}</span>;
}
