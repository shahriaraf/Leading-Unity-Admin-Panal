import React, { useEffect, useState } from 'react';
import { Icon, ICONS, ModernCard, StyledInput } from './Ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sumMax = (criteria) => criteria.reduce((s, c) => s + Number(c.max || 0), 0);

const clamp = (val, min, max) => Math.min(Math.max(Number(val), min), max);

// ─── Single criteria group ────────────────────────────────────────────────────
// Shows a dynamic list of criteria rows with Add / Remove buttons.
// Enforces: each max ≥ 1, total = 100, at least 1 row, at most 10 rows.

const CriteriaGroup = ({ title, dotColor, borderColor, badgeColor, criteria, onChange }) => {
  const total = sumMax(criteria);
  const totalOk = total === 100;

  const handleNameChange = (i, val) => {
    const next = criteria.map((c, idx) => idx === i ? { ...c, name: val } : c);
    onChange(next);
  };

  const handleMaxChange = (i, val) => {
    // Allow free typing — clamp only on blur / add / save
    const next = criteria.map((c, idx) => idx === i ? { ...c, max: val === '' ? '' : Number(val) } : c);
    onChange(next);
  };

  const handleMaxBlur = (i) => {
    const next = criteria.map((c, idx) =>
      idx === i ? { ...c, max: clamp(c.max, 1, 99) } : c
    );
    onChange(next);
  };

  const addCriterion = () => {
    if (criteria.length >= 10) return;
    // Give the new criterion whatever points remain up to 100, minimum 1
    const remaining = Math.max(1, 100 - total);
    onChange([...criteria, { name: `Criteria ${criteria.length + 1}`, max: remaining }]);
  };

  const removeCriterion = (i) => {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, idx) => idx !== i));
  };

  return (
    <div className={`p-5 bg-slate-50 rounded-xl border ${borderColor} transition-colors`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
        </div>
        {/* Running total badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalOk
          ? 'bg-emerald-100 text-emerald-700'
          : total > 100
            ? 'bg-red-100 text-red-600'
            : 'bg-amber-100 text-amber-700'
          }`}>
          {total} / 100 pts
        </span>
      </div>

      {/* Criteria rows */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div key={i} className="flex gap-2 items-end">
            {/* Index badge */}
            <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${badgeColor} mt-auto mb-1`}>
              {i + 1}
            </span>
            {/* Name */}
            <div className="grow">
              <StyledInput
                label="Criterion label"
                value={c.name}
                onChange={e => handleNameChange(i, e.target.value)}
              />
            </div>
            {/* Max pts */}
            <div className="w-20 shrink-0">
              <StyledInput
                label="Max pts"
                type="number"
                min={1}
                max={99}
                value={c.max}
                onChange={e => handleMaxChange(i, e.target.value)}
                onBlur={() => handleMaxBlur(i)}
              />
            </div>
            {/* Remove button — hidden when only 1 row */}
            {criteria.length > 1 && (
              <button
                onClick={() => removeCriterion(i)}
                className="shrink-0 mb-1 w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                title="Remove this criterion"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add criterion button */}
      {criteria.length < 10 && (
        <button
          onClick={addCriterion}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 text-slate-400 hover:text-teal-600 text-sm font-semibold transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add criterion
        </button>
      )}

      {/* Error hints */}
      {!totalOk && (
        <p className={`mt-3 text-xs font-semibold ${total > 100 ? 'text-red-500' : 'text-amber-600'}`}>
          {total > 100
            ? `Over by ${total - 100} pts — reduce some max values.`
            : `${100 - total} pts still unassigned — adjust max values to reach 100.`}
        </p>
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

  // Check if both groups sum to exactly 100
  const defTotal = sumMax(evalConfig.defenseCriteria || []);
  const ownTotal = sumMax(evalConfig.ownTeamCriteria || []);
  const totalsValid = defTotal === 100 && ownTotal === 100;

  const handleSave = async () => {
    if (!totalsValid) return; // button is disabled anyway, but belt-and-suspenders
    await onSave();
    setIsDirty(false);
  };

  return (
    <ModernCard
      title="Scoring Protocol"
      subtitle="Define evaluation criteria labels and maximum marks. Both groups must total exactly 100 pts."
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CriteriaGroup
          title="Defense Board"
          dotColor="bg-teal-500"
          borderColor="border-teal-100"
          badgeColor="bg-teal-500"
          criteria={evalConfig.defenseCriteria || []}
          onChange={next => setEvalConfig({ ...evalConfig, defenseCriteria: next })}
        />
        <CriteriaGroup
          title="Supervisor (internal)"
          dotColor="bg-indigo-500"
          borderColor="border-indigo-100"
          badgeColor="bg-indigo-500"
          criteria={evalConfig.ownTeamCriteria || []}
          onChange={next => setEvalConfig({ ...evalConfig, ownTeamCriteria: next })}
        />
      </div>

      {/* Save row */}
      <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {!totalsValid
            ? 'Fix the point totals above before saving.'
            : 'Changes affect how evaluators see scoring sheets going forward.'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty || !totalsValid}
          className="px-7 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-100 transition-all active:scale-95 disabled:shadow-none whitespace-nowrap"
        >
          {saving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </ModernCard>
  );
};

export default ScoringConfig;