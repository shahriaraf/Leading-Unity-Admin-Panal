import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from './api';
import ToggleCard from './ToggleCard';
import ScoringConfig from './ScoringConfig';
import DataExport from './DataExport';
import DangerZone from './DangerZone';


const DEFAULT_CONFIG = {
  criteria1Name: 'Defense 1', criteria1Max: 30,
  criteria2Name: 'Defense 2', criteria2Max: 30,
  ownTeamCriteria1Name: 'Own 1', ownTeamCriteria1Max: 40,
  ownTeamCriteria2Name: 'Own 2', ownTeamCriteria2Max: 40,
};

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [evalConfig, setEvalConfig] = useState(DEFAULT_CONFIG);
  const [courses, setCourses] = useState([]);
  const [savingCriteria, setSavingCriteria] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settingsRes, coursesRes] = await Promise.all([
          api.get('settings'),
          api.get('courses'),
        ]);
        const s = settingsRes.data;
        setIsRegistrationOpen(s.isStudentRegistrationOpen);
        setIsSubmissionOpen(s.isSubmissionOpen ?? false);
        setEvalConfig({
          criteria1Name: s.criteria1Name || DEFAULT_CONFIG.criteria1Name,
          criteria1Max: s.criteria1Max || DEFAULT_CONFIG.criteria1Max,
          criteria2Name: s.criteria2Name || DEFAULT_CONFIG.criteria2Name,
          criteria2Max: s.criteria2Max || DEFAULT_CONFIG.criteria2Max,
          ownTeamCriteria1Name: s.ownTeamCriteria1Name || DEFAULT_CONFIG.ownTeamCriteria1Name,
          ownTeamCriteria1Max: s.ownTeamCriteria1Max || DEFAULT_CONFIG.ownTeamCriteria1Max,
          ownTeamCriteria2Name: s.ownTeamCriteria2Name || DEFAULT_CONFIG.ownTeamCriteria2Name,
          ownTeamCriteria2Max: s.ownTeamCriteria2Max || DEFAULT_CONFIG.ownTeamCriteria2Max,
        });
        setCourses(coursesRes.data);
      } catch { toast.error("Failed to load settings"); }
    })();
  }, []);

  const makeToggle = (state, setState, endpoint, openMsg, closeMsg) => async () => {
    setState(!state);
    try {
      await api.patch(`settings/${endpoint}`);
      toast.success(!state ? openMsg : closeMsg);
    } catch { setState(state); toast.error("Failed"); }
  };

  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try { await api.post('settings/evaluation', evalConfig); toast.success("Settings saved!"); }
    catch { toast.error("Save failed"); }
    finally { setSavingCriteria(false); }
  };

  return (
    <div className="min-h-screen p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '14px' } }} />

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Control</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Configure metrics, access & data.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM ONLINE
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-2 space-y-8">

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ToggleCard
              title="Student Access"
              isOpen={isRegistrationOpen}
              onToggle={makeToggle(isRegistrationOpen, setIsRegistrationOpen, 'toggle-registration', 'Registration Opened', 'Registration Closed')}
              openLabel="Gateway Open" closedLabel="Gateway Locked"
              openBtnLabel="Close Registration" closedBtnLabel="Open Registration"
              colorOpen="emerald"
            />
            <ToggleCard
              title="Project Submission"
              isOpen={isSubmissionOpen}
              onToggle={makeToggle(isSubmissionOpen, setIsSubmissionOpen, 'toggle-submission', 'Submissions Opened', 'Submissions Paused')}
              openLabel="Accepting Projects" closedLabel="Submissions Paused"
              openBtnLabel="Pause Submissions" closedBtnLabel="Enable Submissions"
              iconKey="upload" colorOpen="indigo"
            />
          </div>

          {/* Scoring */}
          <ScoringConfig
            evalConfig={evalConfig}
            setEvalConfig={setEvalConfig}
            onSave={handleSaveEvaluation}
            saving={savingCriteria}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <DataExport courses={courses} evalConfig={evalConfig} />
          <DangerZone />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;