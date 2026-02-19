import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Icons (Inline SVGs) ---
const DownloadIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const TableIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const GradingIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const WarningIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const FileIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [courses, setCourses] = useState([]);

  // Updated Config State: 4 fields for Defense, 4 fields for Own Team
  const [evalConfig, setEvalConfig] = useState({
    criteria1Name: 'Defense Criteria 1', criteria1Max: 30,
    criteria2Name: 'Defense Criteria 2', criteria2Max: 30,
    ownTeamCriteria1Name: 'Own Criteria 1', ownTeamCriteria1Max: 40,
    ownTeamCriteria2Name: 'Own Criteria 2', ownTeamCriteria2Max: 40,
  });

  const API_URL = 'https://leading-unity-nest-backend.vercel.app/api';

  const getAuthConfig = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch { return {}; }
  };

  const fetchData = async () => {
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
      toast.error("Could not load system data.", { error });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleHandler = async () => {
    const previousState = isRegistrationOpen;
    setIsRegistrationOpen(!isRegistrationOpen);
    try {
      await axios.patch(`${API_URL}/settings/toggle-registration`, {}, getAuthConfig());
      toast.success(`Registration is now ${!previousState ? 'OPEN' : 'CLOSED'}`);
    } catch (error) {
      setIsRegistrationOpen(previousState);
      toast.error("Failed to update setting", { error });
    }
  };

  // --- HANDLER: Save Criteria ---
  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try {
      await axios.post(`${API_URL}/settings/evaluation`, evalConfig, getAuthConfig());
      toast.success("All criteria updated successfully!");
    } catch (error) {
      toast.error("Failed to save settings.", { error });
    } finally {
      setSavingCriteria(false);
    }
  };

  // --- HANDLER: Excel Export Logic (Updated for Average) ---
  const handleDownloadReport = async (courseFilter = null) => {
    setExporting(true);
    const toastId = toast.loading(`Generating report...`);

    try {
      const config = getAuthConfig();
      const { data } = await axios.get(`${API_URL}/proposals`, config);

      let finalData = data;
      if (courseFilter) {
        finalData = data.filter(p => p.course?._id === courseFilter._id);
      }

      if (!finalData || finalData.length === 0) {
        toast.dismiss(toastId);
        toast.error("No submissions found.");
        setExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheetName = courseFilter ? courseFilter.courseCode : 'Master Sheet';
      const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

      // Define Columns
      worksheet.columns = [
        { header: 'Course', key: 'courseCode', width: 12 },
        { header: 'Project Title', key: 'title', width: 25 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Team Members', key: 'members', width: 55 },
        { header: 'Assigned Sup.', key: 'assigned', width: 20 },
        // Supervisor Own Marks
        { header: `Sup: ${evalConfig.ownTeamCriteria1Name}`, key: 'own1', width: 18 },
        { header: `Sup: ${evalConfig.ownTeamCriteria2Name}`, key: 'own2', width: 18 },
        { header: 'Sup Total', key: 'ownTotal', width: 12 },
        // Defense Marks (Average)
        { header: `Def: ${evalConfig.criteria1Name} (Avg)`, key: 'def1', width: 18 },
        { header: `Def: ${evalConfig.criteria2Name} (Avg)`, key: 'def2', width: 18 },
        { header: 'Def Total (Avg)', key: 'defTotal', width: 15 },
        // Grand Total
        { header: 'Grand Total', key: 'grand', width: 15 },
      ];

      // Style Header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      finalData.forEach((item) => {
        const members = item.teamMembers || [];
        const allMarks = item.marks || [];

        // String builders
        let memberStr = '', assignedStr = '';
        let own1Str = '', own2Str = '', ownTotStr = '';
        let def1Str = '', def2Str = '', defTotStr = '';
        let grandStr = '';

        members.forEach((m, index) => {
           const suffix = index < members.length - 1 ? '\n' : ''; 
           
           // Member Details
           memberStr += `${m.name} (${m.studentId}) - CGPA: ${m.cgpa || 'N/A'}${suffix}`;

           // --- 1. SUPERVISOR MARKS (Type: 'own') ---
           const ownMark = allMarks.find(mark => mark.studentId === m.studentId && mark.type === 'own');
           let o1 = 0, o2 = 0;
           
           if(ownMark) {
             if(ownMark.isAbsent) {
               own1Str += `Abs${suffix}`; own2Str += `Abs${suffix}`; ownTotStr += `0${suffix}`;
             } else {
               o1 = ownMark.criteria1 || 0;
               o2 = ownMark.criteria2 || 0;
               own1Str += `${o1}${suffix}`;
               own2Str += `${o2}${suffix}`;
               ownTotStr += `${o1 + o2}${suffix}`;
             }
           } else {
             own1Str += `-${suffix}`; own2Str += `-${suffix}`; ownTotStr += `-${suffix}`;
           }

           // --- 2. DEFENSE MARKS (Type: 'defense') - Calculate Average ---
           const defMarks = allMarks.filter(mark => mark.studentId === m.studentId && mark.type === 'defense');
           let d1Avg = 0, d2Avg = 0, dTotAvg = 0;

           if(defMarks.length > 0) {
             // Filter out absent records for average calculation logic (or treat as 0, strictly absent means no mark)
             const presentMarks = defMarks.filter(mk => !mk.isAbsent);
             
             if(presentMarks.length > 0) {
               const sum1 = presentMarks.reduce((acc, curr) => acc + (curr.criteria1 || 0), 0);
               const sum2 = presentMarks.reduce((acc, curr) => acc + (curr.criteria2 || 0), 0);
               d1Avg = parseFloat((sum1 / presentMarks.length).toFixed(2));
               d2Avg = parseFloat((sum2 / presentMarks.length).toFixed(2));
               dTotAvg = parseFloat((d1Avg + d2Avg).toFixed(2));

               def1Str += `${d1Avg}${suffix}`;
               def2Str += `${d2Avg}${suffix}`;
               defTotStr += `${dTotAvg}${suffix}`;
             } else {
               // All marked absent
               def1Str += `Abs${suffix}`; def2Str += `Abs${suffix}`; defTotStr += `0${suffix}`;
             }
           } else {
             def1Str += `-${suffix}`; def2Str += `-${suffix}`; defTotStr += `-${suffix}`;
           }

           // --- 3. GRAND TOTAL ---
           // Supervisor Total + Defense Avg Total
           const grandTotal = (ownMark && !ownMark.isAbsent ? (o1+o2) : 0) + dTotAvg;
           grandStr += `${grandTotal.toFixed(2)}${suffix}`;
        });

        // Assigned Supervisor
        assignedStr = item.assignedSupervisor ? item.assignedSupervisor.name : 'Not Assigned';

        // Add Row
        const row = worksheet.addRow({
          courseCode: item.course?.courseCode || 'N/A',
          title: item.title,
          status: item.status.toUpperCase(),
          members: memberStr,
          assigned: assignedStr,
          own1: own1Str, own2: own2Str, ownTotal: ownTotStr,
          def1: def1Str, def2: def2Str, defTotal: defTotStr,
          grand: grandStr
        });

        // --- ROW HEIGHT CALCULATION (Crucial for display) ---
        const memberLines = members.length || 1;
        row.height = Math.max(25, memberLines * 20); // 20px per line
      });

      // Styling Loop
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = courseFilter 
         ? `${courseFilter.courseCode}_Report.xlsx`
         : `Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
         
      saveAs(new Blob([buffer]), fileName);

      toast.success("Downloaded!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // --- DANGER ZONE UI ---
  const confirmAction = (title, message, onConfirm) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[300px] p-1">
        <div className="flex items-center gap-2 text-rose-600 font-bold"><WarningIcon /><span>{title}</span></div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className="flex-1 px-3 py-2 text-sm text-white bg-rose-600 rounded-lg">Yes, Delete</button>
        </div>
      </div>
    ), { duration: 5000, style: { border: '1px solid #FECDD3', background: '#FFF1F2' }});
  };

  const handleDeleteAllUsers = () => {
    confirmAction("Delete All Users?", "This deletes ALL Students/Supervisors. Irreversible.", async () => {
      try { await axios.delete(`${API_URL}/users`, getAuthConfig()); toast.success("Users deleted."); }
      catch { toast.error("Failed to delete."); }
    });
  };

  const handleDeleteAllSubmissions = () => {
    confirmAction("Delete All Submissions?", "Deletes ALL Proposals/Marks. Irreversible.", async () => {
      try { await axios.delete(`${API_URL}/proposals`, getAuthConfig()); toast.success("Submissions deleted."); }
      catch { toast.error("Failed to delete."); }
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50/50">
      <Toaster position="top-right" />
      
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage global configurations and export data.</p>
      </div>

      <div className="max-w-4xl grid gap-8">
        
        {/* Card 1: Registration */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
          <div className={`absolute top-0 left-0 w-full h-1 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isRegistrationOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><SettingsIcon /></div>
                <h3 className="text-lg font-bold text-gray-900">Student Registration</h3>
              </div>
              <p className="text-sm text-gray-500">Control access to mobile app sign-up.</p>
            </div>
            <button onClick={toggleHandler} className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${isRegistrationOpen ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Card 2: Evaluation (Split into 2 Sections) */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><GradingIcon /></div>
            <h3 className="text-lg font-bold text-gray-900">Evaluation Criteria</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Defense Board */}
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
               <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-4 border-b border-purple-200 pb-2">Defense Board (All Teams)</h4>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Criteria 1</label>
                    <div className="flex gap-2">
                        <input className="w-2/3 text-sm border-gray-300 rounded-lg" value={evalConfig.criteria1Name} onChange={e => setEvalConfig({...evalConfig, criteria1Name: e.target.value})} placeholder="Name" />
                        <input className="w-1/3 text-sm border-gray-300 rounded-lg" type="number" value={evalConfig.criteria1Max} onChange={e => setEvalConfig({...evalConfig, criteria1Max: e.target.value})} placeholder="Max" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Criteria 2</label>
                    <div className="flex gap-2">
                        <input className="w-2/3 text-sm border-gray-300 rounded-lg" value={evalConfig.criteria2Name} onChange={e => setEvalConfig({...evalConfig, criteria2Name: e.target.value})} placeholder="Name" />
                        <input className="w-1/3 text-sm border-gray-300 rounded-lg" type="number" value={evalConfig.criteria2Max} onChange={e => setEvalConfig({...evalConfig, criteria2Max: e.target.value})} placeholder="Max" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Right: Supervisor Own */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
               <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-4 border-b border-indigo-200 pb-2">Supervisor (Own Team)</h4>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Criteria 1</label>
                    <div className="flex gap-2">
                        <input className="w-2/3 text-sm border-gray-300 rounded-lg" value={evalConfig.ownTeamCriteria1Name} onChange={e => setEvalConfig({...evalConfig, ownTeamCriteria1Name: e.target.value})} placeholder="Name" />
                        <input className="w-1/3 text-sm border-gray-300 rounded-lg" type="number" value={evalConfig.ownTeamCriteria1Max} onChange={e => setEvalConfig({...evalConfig, ownTeamCriteria1Max: e.target.value})} placeholder="Max" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Criteria 2</label>
                    <div className="flex gap-2">
                        <input className="w-2/3 text-sm border-gray-300 rounded-lg" value={evalConfig.ownTeamCriteria2Name} onChange={e => setEvalConfig({...evalConfig, ownTeamCriteria2Name: e.target.value})} placeholder="Name" />
                        <input className="w-1/3 text-sm border-gray-300 rounded-lg" type="number" value={evalConfig.ownTeamCriteria2Max} onChange={e => setEvalConfig({...evalConfig, ownTeamCriteria2Max: e.target.value})} placeholder="Max" />
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveEvaluation} disabled={savingCriteria} className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {savingCriteria ? 'Saving...' : <><SaveIcon /> Save Configuration</>}
            </button>
          </div>
        </div>

        {/* --- Card 3: Export Data --- */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><TableIcon /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-500">Download Excel sheets for all courses or individual ones.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Master Button */}
            <button 
              onClick={() => handleDownloadReport(null)}
              disabled={exporting}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm disabled:opacity-70"
            >
              <DownloadIcon /> Download Master Sheet (All Courses)
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or Select Individual Course</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Course Buttons Grid */}
            {courses.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {courses.map(course => (
                        <button
                            key={course._id}
                            onClick={() => handleDownloadReport(course)}
                            disabled={exporting}
                            className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                            <FileIcon /> {course.courseCode}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-gray-400 italic">No courses available.</p>
            )}
          </div>
        </div>

        {/* Card 4: Danger Zone */}
        <div className="relative overflow-hidden bg-white border border-rose-200 shadow-lg rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-600"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600"><WarningIcon /></div>
            <h3 className="text-lg font-bold text-gray-900">Danger Zone</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleDeleteAllUsers} className="flex-1 flex items-center justify-center px-4 py-3 border border-rose-300 text-rose-700 font-semibold rounded-lg hover:bg-rose-50"><TrashIcon /> Delete All Users</button>
            <button onClick={handleDeleteAllSubmissions} className="flex-1 flex items-center justify-center px-4 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700"><TrashIcon /> Delete All Submissions</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;