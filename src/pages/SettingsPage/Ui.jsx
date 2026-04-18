/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export const Icon = ({ path, cls = "w-5 h-5" }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
  </svg>
);

export const ICONS = {
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  lockOpen: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
  lockClosed: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m-4-4v12",
  alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

export const ModernCard = ({ children, title, subtitle, icon, accentColor = "indigo", className = "" }) => {
  const accentMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', blob: 'bg-indigo-50' },
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   blob: 'bg-teal-50'   },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   blob: 'bg-blue-50'   },
    emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-600',blob: 'bg-emerald-50'},
    rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   blob: 'bg-rose-50'   },
  };
  const accent = accentMap[accentColor] || accentMap.indigo;

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden ${className}`}>
      <div className={`absolute -top-8 -right-8 w-28 h-28 ${accent.blob} rounded-full opacity-40 pointer-events-none`} />
      {title && (
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className={`p-2.5 rounded-xl ${accent.bg} ${accent.text}`}>{icon}</div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="h-px bg-slate-100 flex-1" />
  </div>
);

export const StyledInput = ({ label, value, onChange, type = "text" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
    <input
      type={type} value={value} onChange={onChange}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300 text-sm"
    />
  </div>
);