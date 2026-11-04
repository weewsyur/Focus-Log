import type { ButtonHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'sm' | 'md'; icon?: ReactNode }

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-app-success text-app-white hover:brightness-95',
  secondary: 'bg-app-primary text-app-white hover:brightness-95',
  ghost: 'border border-app-primary bg-app-white text-app-primary hover:bg-app-blue-pale',
  danger: 'border border-app-danger-border bg-app-white text-app-danger hover:bg-app-danger-soft',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', icon, children, ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-6 py-2.5 text-sm';
  return (
    <button type={type} {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANTS[variant]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}
