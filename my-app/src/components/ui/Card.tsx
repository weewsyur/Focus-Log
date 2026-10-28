import type { ReactNode } from 'react';

interface CardProps { title?: string; action?: ReactNode; children: ReactNode; className?: string }

export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <section className={`min-w-0 rounded-xl bg-app-white p-5 text-app-navy ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
