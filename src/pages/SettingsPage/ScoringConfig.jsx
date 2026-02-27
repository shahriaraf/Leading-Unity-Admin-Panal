import React from 'react';
import { Icon, ICONS, ModernCard, StyledInput } from './Ui';


const CriteriaGroup = ({ title, dotColor, fields, evalConfig, setEvalConfig }) => (
  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-100 transition-colors">
    <div className="flex items-center gap-2 mb-5">
      <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-5">
      {fields.map(({ label, nameKey, maxKey }) => (
        <div key={nameKey} className="flex gap-3 items-end">
          <div className="grow">
            <StyledInput label={label} value={evalConfig[nameKey]} onChange={e => setEvalConfig({ ...evalConfig, [nameKey]: e.target.value })} />
          </div>
          <div className="w-20">
            <StyledInput label="Max" type="number" value={evalConfig[maxKey]} onChange={e => setEvalConfig({ ...evalConfig, [maxKey]: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ScoringConfig = ({ evalConfig, setEvalConfig, onSave, saving }) => (
  <ModernCard title="Scoring Protocol" subtitle="Define max marks & labels." icon={<Icon path={ICONS.chart} />} accentColor="teal">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <CriteriaGroup
        title="Defense Board" dotColor="bg-teal-500"
        evalConfig={evalConfig} setEvalConfig={setEvalConfig}
        fields={[
          { label: 'Label 1', nameKey: 'criteria1Name', maxKey: 'criteria1Max' },
          { label: 'Label 2', nameKey: 'criteria2Name', maxKey: 'criteria2Max' },
        ]}
      />
      <CriteriaGroup
        title="Supervisor (Internal)" dotColor="bg-indigo-500"
        evalConfig={evalConfig} setEvalConfig={setEvalConfig}
        fields={[
          { label: 'Label 1', nameKey: 'ownTeamCriteria1Name', maxKey: 'ownTeamCriteria1Max' },
          { label: 'Label 2', nameKey: 'ownTeamCriteria2Name', maxKey: 'ownTeamCriteria2Max' },
        ]}
      />
    </div>
    <div className="mt-8 flex justify-end">
      <button
        onClick={onSave} disabled={saving}
        className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-200 transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  </ModernCard>
);

export default ScoringConfig;