import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'sm' | 'md' }

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#32CC59] text-white hover:brightness-95',
  secondary: 'bg-[#2180DB] text-white hover:brightness-95',
  ghost: 'border border-[#2180DB] bg-white text-[#2180DB] hover:bg-[#EAF3FC]',
  danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-6 py-2.5 text-sm';
  return (
    <button type={type} {...rest}
      className={`rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANTS[variant]} ${className}`} />
  );
}
