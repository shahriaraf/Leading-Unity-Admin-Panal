import React from 'react';
import toast from 'react-hot-toast';
import { api } from './api';
import { generateMainReport, generateDefenseSchedule } from './ExcelSheets'; // Updated imports
import { Icon, ICONS, ModernCard } from './Ui';
import { CalendarCheck } from 'lucide-react';

const DataExport = ({ courses, evalConfig }) => {
  const [exporting, setExporting] = React.useState(false);

  // Generic handler for both report types
  const handleExport = async (type, courseFilter = null) => {
    setExporting(true);
    const label = type === 'main' ? 'Full Report' : 'Schedule';
    const toastId = toast.loading(`Generating ${label}...`);

    try {
      const { data: proposals } = await api.get('proposals');
      
      if (type === 'main') {
        await generateMainReport(proposals, evalConfig, courseFilter);
      } else {
        await generateDefenseSchedule(proposals, courseFilter);
      }

      toast.success("Downloaded!", { id: toastId });
    } catch (err) {
      console.error(err);
      if (err.message === 'NO_DATA') toast.error("No data found.", { id: toastId });
      else toast.error("Export Failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ModernCard title="Data Export" subtitle="Generate Excel reports & schedules." icon={<Icon path={ICONS.download} />} accentColor="blue">
      
      {/* --- Master Actions --- */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <button
          onClick={() => handleExport('main', null)} disabled={exporting}
          className="py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
        >
          {exporting ? <span className="animate-pulse">...</span> : <><Icon path={ICONS.download} /> Full Report</>}
        </button>
        <button
          onClick={() => handleExport('schedule', null)} disabled={exporting}
          className="py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
        >
          {exporting ? <span className="animate-pulse">...</span> : <><CalendarCheck></CalendarCheck> Defense Schedule</>}
        </button>
      </div>

      {/* --- Course List --- */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px bg-slate-100 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Specific Course</span>
        <div className="h-px bg-slate-100 flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
        {courses.length > 0 ? courses.map(c => (
           <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-3">
                 <span className="text-sm font-bold text-slate-600">{c.courseCode}</span>
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={() => handleExport('main', c)} 
                   disabled={exporting}
                   className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                 >
                   Report
                 </button>
                 <button 
                   onClick={() => handleExport('schedule', c)} 
                   disabled={exporting}
                   className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 rounded-md transition-colors disabled:opacity-50"
                 >
                   Schedule
                 </button>
              </div>
           </div>
        )) : <p className="text-xs text-center text-slate-400 py-4 italic">No courses available</p>}
      </div>
    </ModernCard>
  );
};

export default DataExport;