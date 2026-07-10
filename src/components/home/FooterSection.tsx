import React from 'react';

export const FooterSection: React.FC = () => {
  return (
    <footer className="text-center py-8 w-full border-t border-slate-200 mt-4">
      <p className="text-[11px] font-medium text-slate-400 tracking-wide">
        © {new Date().getFullYear()} IFA Master Coach. All rights reserved.
      </p>
    </footer>
  );
};