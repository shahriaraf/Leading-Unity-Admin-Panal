import React from 'react';
import toast from 'react-hot-toast';
import { api } from './api';
import { generateMainReport, generateDefenseSchedule, generateRequestsReport } from './ExcelSheets';
import { Icon, ICONS, ModernCard } from './Ui';
import { CalendarCheck, UserPlus } from 'lucide-react';

/**
 * UX improvements:
 * - Master export actions have clear labels with icons explaining the output type
 * - Added a short description under each button so admins know what they're downloading
 * - Course-specific section has a clear "filter" framing — not a separate feature,
 *   just a scoped version of the same exports
 * - Loading state is more descriptive (shows what's being generated)
 */

const EXPORT_META = {
  main:     { label: 'Full Report',             desc: 'All proposals with scores & supervisors' },
  schedule: { label: 'Defense Schedule',         desc: 'Time slots, rooms & assigned panels'    },
  requests: { label: 'Team Requests (incomplete)', desc: 'Groups still missing supervisors'       },
};

const DataExport = ({ courses, evalConfig }) => {
  const [exporting, setExporting] = React.useState(null);

  const handleExport = async (type, courseFilter = null) => {
    setExporting(type + (courseFilter ? courseFilter._id : ''));
    const toastId = toast.loading(`Generating ${EXPORT_META[type].label}…`);
    try {
      const [{ data: proposals }, { data: users }] = await Promise.all([
        api.get('proposals'),
        api.get('users'),
      ]);
      const allSupervisors = users.filter(u => u.role === 'supervisor');

      if (type === 'main')         await generateMainReport(proposals, evalConfig, allSupervisors, courseFilter);
      else if (type === 'schedule') await generateDefenseSchedule(proposals, allSupervisors, courseFilter);
      else if (type === 'requests') await generateRequestsReport(proposals, courseFilter);

      toast.success('Downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      if (err.message === 'NO_DATA') toast.error('No data found for this course.', { id: toastId });
      else toast.error('Export failed.', { id: toastId });
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  return (
    <ModernCard
      title="Data Export"
      subtitle="Download Excel reports and schedules."
      icon={<Icon path={ICONS.download} />}
      accentColor="blue"
    >
      {/* Master export buttons */}
      <div className="space-y-2 mb-6">
        {(['main', 'schedule', 'requests']).map(type => {
          const { label, desc } = EXPORT_META[type];
          const styles = {
            main:     'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200',
            schedule: 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-700',
            requests: 'bg-orange-50 border-2 border-orange-200 text-orange-700 hover:bg-orange-100',
          };
          const icons = {
            main:     <Icon path={ICONS.download} />,
            schedule: <CalendarCheck size={16} />,
            requests: <UserPlus size={16} />,
          };
          return (
            <button
              key={type}
              onClick={() => handleExport(type, null)}
              disabled={isExporting}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all active:scale-95 disabled:opacity-60 ${styles[type]}`}
            >
              <span className="shrink-0">{icons[type]}</span>
              <span className="text-left">
                <span className="block">{label}</span>
                <span className={`block text-[10px] font-medium opacity-60`}>{desc}</span>
              </span>
              {isExporting === type && <span className="ml-auto animate-spin">↻</span>}
            </button>
          );
        })}
      </div>

      {/* Course filter section */}
      {courses.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Filter by course</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
            {courses.map(c => (
              <div
                key={c._id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
              >
                <span className="text-sm font-bold text-slate-600">{c.courseCode}</span>
                <div className="flex gap-1.5">
                  {(['main', 'schedule', 'requests']).map(type => {
                    const shortLabels = { main: 'Report', schedule: 'Schedule', requests: 'Requests' };
                    const shortStyles = {
                      main:     'text-blue-600 bg-blue-50 hover:bg-blue-100',
                      schedule: 'text-slate-600 bg-white border border-slate-200 hover:border-slate-400',
                      requests: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
                    };
                    return (
                      <button
                        key={type}
                        onClick={() => handleExport(type, c)}
                        disabled={isExporting}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors disabled:opacity-50 ${shortStyles[type]}`}
                      >
                        {shortLabels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ModernCard>
  );
};

export default DataExport;