/* eslint-disable no-unused-vars */
import React from 'react';
import { Icon, ICONS } from './Ui';

/**
 * Fixed: Removed dynamic Tailwind class interpolation (`bg-${color}-50`).
 * Tailwind purges unused classes at build time — dynamic strings are invisible
 * to the scanner and will not be included in the bundle.
 * Each color variant now uses explicit, static class strings.
 */

const VARIANTS = {
  emerald: {
    cardOpen:   'bg-emerald-50 border-emerald-200',
    cardClosed: 'bg-white border-slate-200',
    titleOpen:  'text-emerald-900',
    titleClosed:'text-slate-700',
    subOpen:    'text-emerald-600',
    subClosed:  'text-slate-400',
    iconOpen:   'bg-white text-emerald-500 shadow-sm',
    iconClosed: 'bg-slate-100 text-slate-400',
    btnOpen:    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200',
    btnClosed:  'bg-slate-800 text-white hover:bg-slate-700 shadow-md shadow-slate-200',
    dot:        'bg-emerald-400',
  },
  indigo: {
    cardOpen:   'bg-indigo-50 border-indigo-200',
    cardClosed: 'bg-white border-slate-200',
    titleOpen:  'text-indigo-900',
    titleClosed:'text-slate-700',
    subOpen:    'text-indigo-600',
    subClosed:  'text-slate-400',
    iconOpen:   'bg-white text-indigo-500 shadow-sm',
    iconClosed: 'bg-slate-100 text-slate-400',
    btnOpen:    'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-200',
    btnClosed:  'bg-slate-800 text-white hover:bg-slate-700 shadow-md shadow-slate-200',
    dot:        'bg-indigo-400',
  },
};

const ToggleCard = ({
  title,
  isOpen,
  onToggle,
  openLabel,
  closedLabel,
  openBtnLabel,
  closedBtnLabel,
  iconKey,
  colorOpen = 'emerald',
}) => {
  const v = VARIANTS[colorOpen] || VARIANTS.emerald;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${isOpen ? v.cardOpen : v.cardClosed}`}>
      {/* Status dot */}
      <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isOpen ? `${v.dot} animate-pulse` : 'bg-slate-300'}`} />

      <div className="flex items-start gap-3 mb-6">
        <div className={`p-2 rounded-xl transition-all ${isOpen ? v.iconOpen : v.iconClosed}`}>
          <Icon path={isOpen ? ICONS.lockOpen : ICONS.lockClosed} />
        </div>
        <div>
          <h3 className={`text-sm font-bold transition-colors ${isOpen ? v.titleOpen : v.titleClosed}`}>{title}</h3>
          <p className={`text-xs mt-0.5 font-medium transition-colors ${isOpen ? v.subOpen : v.subClosed}`}>
            {isOpen ? openLabel : closedLabel}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${isOpen ? v.btnOpen : v.btnClosed}`}
      >
        {isOpen ? openBtnLabel : closedBtnLabel}
      </button>
    </div>
  );
};

export default ToggleCard;