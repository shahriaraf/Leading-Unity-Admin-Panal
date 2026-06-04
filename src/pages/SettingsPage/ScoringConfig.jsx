import React, { useEffect, useState } from 'react';
import { Icon, ICONS, ModernCard, StyledInput } from './Ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sumAll = (defenseCriteria, ownTeamCriteria) =>
  [...(defenseCriteria || []), ...(ownTeamCriteria || [])].reduce(
    (s, c) => s + Number(c.max || 0), 0
  );

// ─── Single criteria group ────────────────────────────────────────────────────

const CriteriaGroup = ({
  title, dotColor, borderColor, badgeColor,
  criteria, onChange,
  usedElsewhere,   // sum of max pts already used by the OTHER group
  totalMarks,      // the combined total cap
}) => {
  const groupSum  = criteria.reduce((s, c) => s + Number(c.max || 0), 0);
  const remaining = totalMarks - usedElsewhere - groupSum; // pts left for THIS group to claim

  const handleNameChange = (i, val) => {
    onChange(criteria.map((c, idx) => idx === i ? { ...c, name: val } : c));
  };

  const handleMaxChange = (i, val) => {
    onChange(criteria.map((c, idx) => idx === i ? { ...c, max: val === '' ? '' : Number(val) } : c));
  };

  const handleMaxBlur = (i) => {
    const next = criteria.map((c, idx) => {
      if (idx !== i) return c;
      const parsed = Number(c.max);
      if (isNaN(parsed) || parsed < 1) return { ...c, max: 1 };
      // clamp so this row alone can't push combined total over cap
      const otherRowsSum = criteria.reduce((s, cc, ii) => ii !== i ? s + Number(cc.max || 0) : s, 0);
      const max = totalMarks - usedElsewhere - otherRowsSum;
      return { ...c, max: Math.min(parsed, Math.max(max, 1)) };
    });
    onChange(next);
  };

  const addCriterion = () => {
    if (criteria.length >= 10 || remaining <= 0) return;
    onChange([...criteria, { name: `Criteria ${criteria.length + 1}`, max: remaining }]);
  };

  const removeCriterion = (i) => {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, idx) => idx !== i));
  };

  const allFilled = remaining <= 0;

  return (
    <div className={`p-5 bg-slate-50 rounded-xl border ${borderColor} transition-colors`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {groupSum} pts
        </span>
      </div>

      {/* Criteria rows */}
      <div className="space-y-3">
        {criteria.map((c, i) => {
          // Disable this input if all marks are filled AND this row is not the one being changed
          const otherRowsSum = criteria.reduce((s, cc, ii) => ii !== i ? s + Number(cc.max || 0) : s, 0);
          const maxForThisRow = totalMarks - usedElsewhere - otherRowsSum;
          const isAtMax = maxForThisRow <= 0;

          return (
            <div key={i} className="flex gap-2 items-end">
              <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${badgeColor} mt-auto mb-1`}>
                {i + 1}
              </span>
              <div className="grow">
                <StyledInput
                  label="Criterion label"
                  value={c.name}
                  onChange={e => handleNameChange(i, e.target.value)}
                />
              </div>
              <div className="w-20 shrink-0">
                <StyledInput
                  label="Max pts"
                  type="number"
                  min={1}
                  max={maxForThisRow + Number(c.max || 0)}
                  value={c.max}
                  disabled={isAtMax}
                  onChange={e => handleMaxChange(i, e.target.value)}
                  onBlur={() => handleMaxBlur(i)}
                />
              </div>
              {criteria.length > 1 && (
                <button
                  onClick={() => removeCriterion(i)}
                  className="shrink-0 mb-1 w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add criterion — disabled when no pts remain */}
      {criteria.length < 10 && (
        <button
          onClick={addCriterion}
          disabled={allFilled}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-200 enabled:hover:border-teal-400 text-slate-400 enabled:hover:text-teal-600 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {allFilled ? 'Total marks reached' : 'Add criterion'}
        </button>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ScoringConfig = ({ evalConfig, setEvalConfig, onSave, saving, savedConfig }) => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!savedConfig) return;
    setIsDirty(JSON.stringify(evalConfig) !== JSON.stringify(savedConfig));
  }, [evalConfig, savedConfig]);

  const totalMarks      = Number(evalConfig.totalMarks || 100);
  const defCriteria     = evalConfig.defenseCriteria  || [];
  const ownCriteria     = evalConfig.ownTeamCriteria  || [];
  const combinedUsed    = sumAll(defCriteria, ownCriteria);
  const combinedOk      = combinedUsed === totalMarks;

  const defSum = defCriteria.reduce((s, c) => s + Number(c.max || 0), 0);
  const ownSum = ownCriteria.reduce((s, c) => s + Number(c.max || 0), 0);

  const handleTotalMarksChange = (val) => {
    const parsed = Number(val);
    if (isNaN(parsed) || parsed < 1) return;
    setEvalConfig({ ...evalConfig, totalMarks: parsed });
  };

  const handleSave = async () => {
    if (!combinedOk) return;
    await onSave();
    setIsDirty(false);
  };

  return (
    <ModernCard
      title="Scoring Protocol"
      subtitle="Set a total mark and distribute it across all criteria. Defense Board + Supervisor combined must fill the total exactly."
      icon={<Icon path={ICONS.chart} />}
      accentColor="teal"
    >
      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          Unsaved changes — remember to save before leaving this page.
        </div>
      )}

      {/* Total marks setter + combined progress bar */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Total Marks</span>
            <div className="w-24">
              <StyledInput
                label=""
                type="number"
                min={1}
                value={totalMarks}
                onChange={e => handleTotalMarksChange(e.target.value)}
              />
            </div>
          </div>

          {/* Combined progress */}
          <div className="grow min-w-[160px]">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-500">Combined used</span>
              <span className={combinedOk ? 'text-emerald-600' : combinedUsed > totalMarks ? 'text-red-500' : 'text-amber-600'}>
                {combinedUsed} / {totalMarks} pts
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              {/* Defense portion */}
              <div
                className="h-full float-left bg-teal-500 transition-all"
                style={{ width: `${Math.min((defSum / totalMarks) * 100, 100)}%` }}
              />
              {/* Own-team portion */}
              <div
                className="h-full float-left bg-indigo-500 transition-all"
                style={{ width: `${Math.min((ownSum / totalMarks) * 100, 100 - (defSum / totalMarks) * 100)}%` }}
              />
            </div>
            <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />Defense: {defSum} pts</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Supervisor: {ownSum} pts</span>
            </div>
          </div>

          {/* Status badge */}
          <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${
            combinedOk
              ? 'bg-emerald-100 text-emerald-700'
              : combinedUsed > totalMarks
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
          }`}>
            {combinedOk ? '✓ Complete' : combinedUsed > totalMarks ? `Over by ${combinedUsed - totalMarks}` : `${totalMarks - combinedUsed} pts left`}
          </span>
        </div>
      </div>

      {/* Two groups side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CriteriaGroup
          title="Defense Board"
          dotColor="bg-teal-500"
          borderColor="border-teal-100"
          badgeColor="bg-teal-500"
          criteria={defCriteria}
          totalMarks={totalMarks}
          usedElsewhere={ownSum}
          onChange={next => setEvalConfig({ ...evalConfig, defenseCriteria: next })}
        />
        <CriteriaGroup
          title="Supervisor (internal)"
          dotColor="bg-indigo-500"
          borderColor="border-indigo-100"
          badgeColor="bg-indigo-500"
          criteria={ownCriteria}
          totalMarks={totalMarks}
          usedElsewhere={defSum}
          onChange={next => setEvalConfig({ ...evalConfig, ownTeamCriteria: next })}
        />
      </div>

      {/* Save row */}
      <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {!combinedOk
            ? 'All criteria combined must exactly equal the total marks before saving.'
            : 'Changes affect how evaluators see scoring sheets going forward.'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty || !combinedOk}
          className="px-7 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-100 transition-all active:scale-95 disabled:shadow-none whitespace-nowrap"
        >
          {saving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </ModernCard>
  );
};

export default ScoringConfig;