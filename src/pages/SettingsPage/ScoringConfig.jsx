import React, { useEffect, useState } from 'react';
import { Icon, ICONS, ModernCard, StyledInput } from './Ui';

const CriteriaGroup = ({ title, dotColor, borderColor, fields, evalConfig, setEvalConfig }) => (
  <div className={`p-5 bg-slate-50 rounded-xl border ${borderColor} transition-colors`}>
    <div className="flex items-center gap-2 mb-4">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4">
      {fields.map(({ label, nameKey, maxKey }) => (
        <div key={nameKey} className="flex gap-3 items-end">
          <div className="grow">
            <StyledInput
              label={label}
              value={evalConfig[nameKey]}
              onChange={e => setEvalConfig({ ...evalConfig, [nameKey]: e.target.value })}
            />
          </div>
          <div className="w-20 shrink-0">
            <StyledInput
              label="Max pts"
              type="number"
              value={evalConfig[maxKey]}
              onChange={e => setEvalConfig({ ...evalConfig, [maxKey]: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ScoringConfig = ({ evalConfig, setEvalConfig, onSave, saving, savedConfig }) => {
  /**
   * UX improvement: Track whether the user has made unsaved changes.
   * Show a sticky indicator so they never lose work unknowingly.
   */
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!savedConfig) return;
    const changed = JSON.stringify(evalConfig) !== JSON.stringify(savedConfig);
    setIsDirty(changed);
  }, [evalConfig, savedConfig]);

  const handleSave = async () => {
    await onSave();
    setIsDirty(false);
  };

  return (
    <ModernCard
      title="Scoring Protocol"
      subtitle="Define evaluation criteria labels and maximum marks."
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
          evalConfig={evalConfig}
          setEvalConfig={setEvalConfig}
          fields={[
            { label: 'Criterion 1 label', nameKey: 'criteria1Name', maxKey: 'criteria1Max' },
            { label: 'Criterion 2 label', nameKey: 'criteria2Name', maxKey: 'criteria2Max' },
          ]}
        />
        <CriteriaGroup
          title="Supervisor (internal)"
          dotColor="bg-indigo-500"
          borderColor="border-indigo-100"
          evalConfig={evalConfig}
          setEvalConfig={setEvalConfig}
          fields={[
            { label: 'Criterion 1 label', nameKey: 'ownTeamCriteria1Name', maxKey: 'ownTeamCriteria1Max' },
            { label: 'Criterion 2 label', nameKey: 'ownTeamCriteria2Name', maxKey: 'ownTeamCriteria2Max' },
          ]}
        />
      </div>

      {/* Save row — always visible, close to the content it controls */}
      <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Changes affect how evaluators see scoring sheets going forward.
        </p>
        <button
          onClick={handleSave}
          disabled={saving || (!isDirty && !!savedConfig)}
          className="px-7 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-100 transition-all active:scale-95 disabled:shadow-none whitespace-nowrap"
        >
          {saving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </ModernCard>
  );
};

export default ScoringConfig;