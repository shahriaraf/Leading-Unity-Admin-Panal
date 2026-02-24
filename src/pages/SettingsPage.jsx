import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Premium Icons ---
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ChartIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const FileIcon = () => <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LockOpenIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
const LockClosedIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const AlertIcon = () => <svg className="w-12 h-12 text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [courses, setCourses] = useState([]);

  const [evalConfig, setEvalConfig] = useState({
    criteria1Name: 'Defense 1', criteria1Max: 30,
    criteria2Name: 'Defense 2', criteria2Max: 30,
    ownTeamCriteria1Name: 'Own 1', ownTeamCriteria1Max: 40,
    ownTeamCriteria2Name: 'Own 2', ownTeamCriteria2Max: 40,
  });

  const API_URL = 'https://leading-unity-nest-backend.vercel.app/api';

  const getAuthConfig = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch { return {}; }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsRes = await axios.get(`${API_URL}/settings`);
      setIsRegistrationOpen(settingsRes.data.isStudentRegistrationOpen);
      
      setEvalConfig({
        criteria1Name: settingsRes.data.criteria1Name || 'Defense 1',
        criteria1Max: settingsRes.data.criteria1Max || 30,
        criteria2Name: settingsRes.data.criteria2Name || 'Defense 2',
        criteria2Max: settingsRes.data.criteria2Max || 30,
        ownTeamCriteria1Name: settingsRes.data.ownTeamCriteria1Name || 'Own 1',
        ownTeamCriteria1Max: settingsRes.data.ownTeamCriteria1Max || 40,
        ownTeamCriteria2Name: settingsRes.data.ownTeamCriteria2Name || 'Own 2',
        ownTeamCriteria2Max: settingsRes.data.ownTeamCriteria2Max || 40,
      });

      const coursesRes = await axios.get(`${API_URL}/courses`);
      setCourses(coursesRes.data);

    } catch (error) {
      toast.error("Failed to load settings",error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleHandler = async () => {
    const previousState = isRegistrationOpen;
    setIsRegistrationOpen(!isRegistrationOpen);
    try {
      await axios.patch(`${API_URL}/settings/toggle-registration`, {}, getAuthConfig());
      toast.success(`Registration ${!previousState ? 'Opened' : 'Closed'}`);
    } catch (error) {
      setIsRegistrationOpen(previousState);
      toast.error("Update failed",error);
    }
  };

  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try {
      await axios.post(`${API_URL}/settings/evaluation`, evalConfig, getAuthConfig());
      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Save failed",error);
    } finally {
      setSavingCriteria(false);
    }
  };

  const handleDownloadReport = async (courseFilter = null) => {
    setExporting(true);
    const toastId = toast.loading("Generating Report...");
    try {
      const { data } = await axios.get(`${API_URL}/proposals`, getAuthConfig());
      let finalData = courseFilter ? data.filter(p => p.course?._id === courseFilter._id) : data;
      
      if (!finalData.length) {
        toast.dismiss(toastId);
        toast.error("No data found.");
        setExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheetName = courseFilter ? courseFilter.courseCode : 'Master Sheet';
      const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

      worksheet.columns = [
        { header: 'Course', key: 'c', width: 12 }, { header: 'Title', key: 't', width: 25 },
        { header: 'Status', key: 's', width: 12 }, { header: 'Team', key: 'm', width: 55 },
        { header: 'Assigned', key: 'a', width: 20 },
        { header: `Sup: ${evalConfig.ownTeamCriteria1Name}`, key: 'o1', width: 15 },
        { header: `Sup: ${evalConfig.ownTeamCriteria2Name}`, key: 'o2', width: 15 },
        { header: 'Sup Tot', key: 'ot', width: 10 },
        { header: `Def: ${evalConfig.criteria1Name}`, key: 'd1', width: 15 },
        { header: `Def: ${evalConfig.criteria2Name}`, key: 'd2', width: 15 },
        { header: 'Def Tot', key: 'dt', width: 10 },
        { header: 'Grand', key: 'g', width: 10 },
      ];

      finalData.forEach((item) => {
        const members = item.teamMembers || [];
        const allMarks = item.marks || [];
        let mStr = '', aStr = '', o1 = '', o2 = '', ot = '', d1 = '', d2 = '', dt = '', gt = '';

        members.forEach((m, idx) => {
           const suffix = idx < members.length - 1 ? '\n' : ''; 
           mStr += `${m.name} (${m.studentId}) | ${m.cgpa || 'N/A'}${suffix}`;

           const ownMark = allMarks.find(mark => mark.studentId === m.studentId && mark.type === 'own');
           let valO1 = 0, valO2 = 0;
           if(ownMark) {
             valO1 = ownMark.criteria1 || 0; valO2 = ownMark.criteria2 || 0;
             o1 += `${valO1}${suffix}`; o2 += `${valO2}${suffix}`; ot += `${valO1+valO2}${suffix}`;
           } else {
             o1 += `-${suffix}`; o2 += `-${suffix}`; ot += `-${suffix}`;
           }

           const defMarks = allMarks.filter(mark => mark.studentId === m.studentId && mark.type === 'defense');
           let valDT = 0;
           if(defMarks.length > 0) {
             const present = defMarks.filter(mk => !mk.isAbsent);
             if(present.length > 0) {
               const s1 = present.reduce((acc, c) => acc + c.criteria1, 0) / present.length;
               const s2 = present.reduce((acc, c) => acc + c.criteria2, 0) / present.length;
               valDT = s1 + s2;
               d1 += `${s1.toFixed(1)}${suffix}`; d2 += `${s2.toFixed(1)}${suffix}`; dt += `${valDT.toFixed(1)}${suffix}`;
             } else {
               d1 += `Abs${suffix}`; d2 += `Abs${suffix}`; dt += `0${suffix}`;
             }
           } else {
             d1 += `-${suffix}`; d2 += `-${suffix}`; dt += `-${suffix}`;
           }

           const grand = (ownMark && !ownMark.isAbsent ? (valO1+valO2) : 0) + valDT;
           gt += `${grand.toFixed(1)}${suffix}`;
        });

        aStr = item.assignedSupervisor ? item.assignedSupervisor.name : 'N/A';
        const row = worksheet.addRow([
          item.course?.courseCode, item.title, item.status, mStr, aStr, 
          o1, o2, ot, d1, d2, dt, gt
        ]);
        row.height = Math.max(25, members.length * 20);
        row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Report.xlsx`);
      toast.success("Downloaded!", { id: toastId });
    } catch { toast.error("Failed", { id: toastId }); } finally { setExporting(false); }
  };

  // --- CONFIRMATION TOAST UI ---
  const confirmAction = (type) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3 min-w-[280px] p-4 bg-white rounded-lg">
        <AlertIcon />
        <h3 className="font-bold text-gray-800 text-lg">Confirm Deletion</h3>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          Are you absolutely sure? This will permanently delete ALL {type}. This action cannot be undone.
        </p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleDelete(type);
            }}
            className="flex-1 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-center' });
  };

  const handleDelete = async (type) => {
    const url = type === 'Users' ? 'users' : 'proposals';
    try {
      await axios.delete(`${API_URL}/${url}`, getAuthConfig());
      toast.success(`${type} deleted successfully.`);
    } catch {
      toast.error(`Failed to delete ${type}.`);
    }
  };

  // --- UI Components ---
  const ModernCard = ({ children, title, subtitle, icon, accentColor = "indigo" }) => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Decorative Blur */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${accentColor}-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
      
      {title && (
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className={`p-3 rounded-2xl bg-${accentColor}-50 text-${accentColor}-600 shadow-inner`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );

  const StyledInput = ({ label, value, onChange, type="text" }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder-slate-300 text-sm shadow-inner"
      />
    </div>
  );

  return (
    <div className="min-h-screen p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '14px' } }}/>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Control</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Configure metrics, access & data.</p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Registration & Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Registration Card */}
             <div className={`relative overflow-hidden rounded-3xl p-6 shadow-sm border transition-all duration-500 ${isRegistrationOpen ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className={`text-lg font-bold ${isRegistrationOpen ? 'text-emerald-800' : 'text-slate-700'}`}>Student Access</h3>
                      <p className={`text-xs mt-1 font-medium ${isRegistrationOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isRegistrationOpen ? 'Gateway Open' : 'Gateway Locked'}
                      </p>
                   </div>
                   <div className={`p-2 rounded-xl ${isRegistrationOpen ? 'bg-white text-emerald-500 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                      {isRegistrationOpen ? <LockOpenIcon /> : <LockClosedIcon />}
                   </div>
                </div>
                <button 
                  onClick={toggleHandler} 
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${isRegistrationOpen ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200' : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200'}`}
                >
                  {isRegistrationOpen ? 'Close Registration' : 'Open Registration'}
                </button>
             </div>

             {/* Version Info Card */}
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white flex flex-col justify-center items-center text-center shadow-lg shadow-indigo-200">
                <div className="p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm"><SettingsIcon /></div>
                <h3 className="font-bold text-xl tracking-tight">LeadUnity Core</h3>
                <p className="text-indigo-100 text-xs font-medium mt-1 uppercase tracking-widest opacity-80">Version 2.4.0 (Stable)</p>
             </div>
          </div>

          {/* Scoring Configuration */}
          <ModernCard title="Scoring Protocol" subtitle="Define max marks & labels." icon={<ChartIcon />} accentColor="teal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Defense */}
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-100 transition-colors">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Defense Board</h4>
                  </div>
                  <div className="space-y-5">
                     <div className="flex gap-3 items-end">
                        <div className="grow"><StyledInput label="Label 1" value={evalConfig.criteria1Name} onChange={e=>setEvalConfig({...evalConfig, criteria1Name: e.target.value})}/></div>
                        <div className="w-20"><StyledInput label="Max" value={evalConfig.criteria1Max} onChange={e=>setEvalConfig({...evalConfig, criteria1Max: e.target.value})} type="number"/></div>
                     </div>
                     <div className="flex gap-3 items-end">
                        <div className="grow"><StyledInput label="Label 2" value={evalConfig.criteria2Name} onChange={e=>setEvalConfig({...evalConfig, criteria2Name: e.target.value})}/></div>
                        <div className="w-20"><StyledInput label="Max" value={evalConfig.criteria2Max} onChange={e=>setEvalConfig({...evalConfig, criteria2Max: e.target.value})} type="number"/></div>
                     </div>
                  </div>
               </div>

               {/* Supervisor */}
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Supervisor (Internal)</h4>
                  </div>
                  <div className="space-y-5">
                     <div className="flex gap-3 items-end">
                        <div className="grow"><StyledInput label="Label 1" value={evalConfig.ownTeamCriteria1Name} onChange={e=>setEvalConfig({...evalConfig, ownTeamCriteria1Name: e.target.value})}/></div>
                        <div className="w-20"><StyledInput label="Max" value={evalConfig.ownTeamCriteria1Max} onChange={e=>setEvalConfig({...evalConfig, ownTeamCriteria1Max: e.target.value})} type="number"/></div>
                     </div>
                     <div className="flex gap-3 items-end">
                        <div className="grow"><StyledInput label="Label 2" value={evalConfig.ownTeamCriteria2Name} onChange={e=>setEvalConfig({...evalConfig, ownTeamCriteria2Name: e.target.value})}/></div>
                        <div className="w-20"><StyledInput label="Max" value={evalConfig.ownTeamCriteria2Max} onChange={e=>setEvalConfig({...evalConfig, ownTeamCriteria2Max: e.target.value})} type="number"/></div>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-8 flex justify-end">
               <button onClick={handleSaveEvaluation} disabled={savingCriteria} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-200 transition-all active:scale-95 disabled:opacity-50">
                 {savingCriteria ? 'Saving...' : 'Save Configuration'}
               </button>
            </div>
          </ModernCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* Data Export */}
          <ModernCard title="Data Export" subtitle="Generate detailed Excel reports." icon={<DownloadIcon />} accentColor="blue">
             <button 
               onClick={() => handleDownloadReport(null)}
               disabled={exporting}
               className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mb-6 active:scale-95 disabled:opacity-70"
             >
               {exporting ? <span className="animate-pulse">Processing...</span> : <><DownloadIcon /> Download Master Sheet</>}
             </button>

             <div className="flex items-center gap-2 mb-3">
               <div className="h-px bg-slate-100 flex-1"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Select Course</span>
               <div className="h-px bg-slate-100 flex-1"></div>
             </div>

             <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide">
                {courses.length > 0 ? courses.map(c => (
                   <button key={c._id} onClick={() => handleDownloadReport(c)} className="flex items-center justify-center p-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 rounded-lg transition-all text-xs font-bold text-slate-600 hover:text-blue-600 shadow-sm">
                      {c.courseCode}
                   </button>
                )) : <p className="col-span-2 text-xs text-center text-slate-400 py-4 italic">No courses available</p>}
             </div>
          </ModernCard>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><TrashIcon /></div>
                <h3 className="font-bold text-slate-800">Danger Zone</h3>
             </div>
             <p className="text-xs text-slate-500 mb-6 leading-relaxed relative z-10">
               Irreversible actions. Deleting users or submissions cannot be undone.
             </p>
             <div className="space-y-3 relative z-10">
                <button onClick={() => confirmAction('Users')} className="w-full py-3 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-sm">
                   Reset All Users
                </button>
                <button onClick={() => confirmAction('Submissions')} className="w-full py-3 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-sm">
                   Reset All Submissions
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;