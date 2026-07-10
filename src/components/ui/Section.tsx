import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && (
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase pl-1">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};