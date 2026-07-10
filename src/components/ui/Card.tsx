import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-slate-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};