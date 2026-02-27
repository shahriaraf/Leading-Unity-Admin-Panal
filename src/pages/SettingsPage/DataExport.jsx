import React from 'react';
import toast from 'react-hot-toast';
import { api } from './api';
import { generateExcelReport } from './ExcelSheets';
import { Icon, ICONS, ModernCard } from './Ui';


const DataExport = ({ courses, evalConfig }) => {
  const [exporting, setExporting] = React.useState(false);

  const handleDownload = async (courseFilter = null) => {
    setExporting(true);
    const toastId = toast.loading("Generating Report...");
    try {
      const { data: proposals } = await api.get('proposals');
      await generateExcelReport(proposals, evalConfig, courseFilter);
      toast.success("Downloaded!", { id: toastId });
    } catch (err) {
      if (err.message === 'NO_DATA') toast.error("No data found.", { id: toastId });
      else toast.error("Failed", { id: toastId });
    } finally { setExporting(false); }
  };

  return (
    <ModernCard title="Data Export" subtitle="Generate detailed Excel reports." icon={<Icon path={ICONS.download} />} accentColor="blue">
      <button
        onClick={() => handleDownload(null)} disabled={exporting}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mb-6 active:scale-95 disabled:opacity-70"
      >
        {exporting ? <span className="animate-pulse">Processing...</span> : <><Icon path={ICONS.download} /> Download Master Sheet</>}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-px bg-slate-100 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Select Course</span>
        <div className="h-px bg-slate-100 flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {courses.length > 0
          ? courses.map(c => (
              <button key={c._id} onClick={() => handleDownload(c)}
                className="flex items-center justify-center p-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 rounded-lg transition-all text-xs font-bold text-slate-600 hover:text-blue-600 shadow-sm"
              >
                {c.courseCode}
              </button>
            ))
          : <p className="col-span-2 text-xs text-center text-slate-400 py-4 italic">No courses available</p>}
      </div>
    </ModernCard>
  );
};

export default DataExport;