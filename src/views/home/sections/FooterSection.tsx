import React from 'react';

export const FooterSection: React.FC = () => {
  return (
    <footer className="pt-8 pb-6 border-t border-slate-100/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-slate-400 px-1">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <span>Version 1.2.0</span>
        <span className="text-slate-200">|</span>
        <span>Build 2026.07.06</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          PWA Connected
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          GitHub Pages Deploy Ready
        </span>
      </div>
    </footer>
  );
};