/* eslint-disable no-unused-vars */
import React from 'react';
import { Icon, ICONS } from './Ui';

const ToggleCard = ({ title, isOpen, onToggle, openLabel, closedLabel, openBtnLabel, closedBtnLabel, iconKey, colorOpen = 'emerald', colorClosed = 'slate' }) => {
  const color = isOpen ? colorOpen : colorClosed;
  const cardBg = isOpen ? `bg-${colorOpen}-50 border-${colorOpen}-100` : 'bg-white border-slate-100';
  const titleColor = isOpen ? `text-${colorOpen}-800` : 'text-slate-700';
  const subtitleColor = isOpen ? `text-${colorOpen}-600` : 'text-slate-400';
  const iconWrap = isOpen ? `bg-white text-${colorOpen}-500 shadow-sm` : 'bg-slate-100 text-slate-400';
  const btnClass = isOpen
    ? `bg-${colorOpen}-500 text-white hover:bg-${colorOpen}-600 shadow-${colorOpen}-200`
    : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200';

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-sm border transition-all duration-500 ${cardBg}`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
          <p className={`text-xs mt-1 font-medium ${subtitleColor}`}>{isOpen ? openLabel : closedLabel}</p>
        </div>
        <div className={`p-2 rounded-xl ${iconWrap}`}>
          <Icon path={isOpen ? ICONS.lockOpen : (iconKey === 'upload' ? ICONS.upload : ICONS.lockClosed)} />
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${btnClass}`}
      >
        {isOpen ? openBtnLabel : closedBtnLabel}
      </button>
    </div>
  );
};

export default ToggleCard;