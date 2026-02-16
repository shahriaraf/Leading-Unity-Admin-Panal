import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Icons ---
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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [courses, setCourses] = useState([]);

  // Evaluation Config State
  const [evalConfig, setEvalConfig] = useState({
    criteria1Name: 'Criteria 1',
    criteria1Max: 30,
    criteria2Name: 'Criteria 2',
    criteria2Max: 30,
  });

  const API_URL = 'https://leading-unity-nest-backend.vercel.app/api';

  const getAuthConfig = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch (e) { return {e}; }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsRes = await axios.get(`${API_URL}/settings`);
      setIsRegistrationOpen(settingsRes.data.isStudentRegistrationOpen);
      setEvalConfig({
        criteria1Name: settingsRes.data.criteria1Name || 'Criteria 1',
        criteria1Max: settingsRes.data.criteria1Max || 30,
        criteria2Name: settingsRes.data.criteria2Name || 'Criteria 2',
        criteria2Max: settingsRes.data.criteria2Max || 30,
      });

      const coursesRes = await axios.get(`${API_URL}/courses`);
      setCourses(coursesRes.data);

    } catch (error) {
      toast.error("Could not load system data.",error);
    } finally {
      setLoading(false);
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
      toast.error("Failed to update setting",error);
    }
  };

  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try {
      await axios.post(`${API_URL}/settings/evaluation`, evalConfig, getAuthConfig());
      toast.success("Criteria updated successfully!");
    } catch (error) {
      toast.error("Failed to save settings.",error);
    } finally {
      setSavingCriteria(false);
    }
  };

  // --- EXCEL LOGIC ---
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

      worksheet.columns = [
        { header: 'Course', key: 'courseCode', width: 12 },
        { header: 'Project Title', key: 'title', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Team Members (Name | ID | CGPA)', key: 'members', width: 60 },
        { header: 'Supervisors (Preferred)', key: 'supervisors', width: 30 },
        { header: 'Assigned Supervisor', key: 'assigned', width: 25 },
        // Marks
        { header: `${evalConfig.criteria1Name}`, key: 'c1', width: 20 },
        { header: `${evalConfig.criteria2Name}`, key: 'c2', width: 20 },
        { header: 'Total', key: 'total', width: 15 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      finalData.forEach((item) => {
        // --- 1. Get Data ---
        const members = item.teamMembers || [];
        const savedMarks = item.marks || [];
        const supervisors = item.supervisors || [];

        let memberString = '';
        let c1String = '';
        let c2String = '';
        let totalString = '';

        // --- 2. Build Strings ---
        members.forEach((m, index) => {
           const suffix = index < members.length - 1 ? '\n' : ''; 
           
           memberString += `${m.name} (${m.studentId}) | CGPA: ${m.cgpa || 'N/A'}${suffix}`;

           const mark = savedMarks.find(mark => mark.studentId === m.studentId);
           
           if (mark) {
             if (mark.isAbsent) {
                c1String += `Absent${suffix}`;
                c2String += `Absent${suffix}`;
                totalString += `0${suffix}`;
             } else {
                c1String += `${mark.criteria1}${suffix}`;
                c2String += `${mark.criteria2}${suffix}`;
                totalString += `${mark.criteria1 + mark.criteria2}${suffix}`;
             }
           } else {
             c1String += `-${suffix}`;
             c2String += `-${suffix}`;
             totalString += `-${suffix}`;
           }
        });

        const supervisorString = supervisors.length > 0 
          ? supervisors.map((s, i) => `${i+1}. ${s.name}`).join('\n') 
          : 'None';
        
        const assignedName = item.assignedSupervisor ? item.assignedSupervisor.name : 'Not Assigned';

        // --- 3. Add Row ---
        const row = worksheet.addRow({
          courseCode: item.course?.courseCode || 'N/A',
          title: item.title,
          status: item.status.toUpperCase(),
          members: memberString, 
          supervisors: supervisorString,
          assigned: assignedName,
          c1: c1String,
          c2: c2String,
          total: totalString
        });

        // --- 4. FIX: Calculate & Set Row Height ---
        // ExcelJS doesn't auto-calculate wrapping height well. 
        // We count the newlines and multiply by a factor (e.g., 18px per line)
        const memberLines = members.length || 1;
        const supervisorLines = supervisors.length || 1;
        const maxLines = Math.max(memberLines, supervisorLines);
        
        // Standard height is ~15. We use 20 per line to give padding.
        row.height = Math.max(25, maxLines * 20); 
      });

      // Style & Border loop
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }; // wrapText is critical
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }
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

        {/* Card 2: Evaluation */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><GradingIcon /></div>
            <h3 className="text-lg font-bold text-gray-900">Evaluation Criteria</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['criteria1', 'criteria2'].map((c, i) => (
              <div key={c} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">Criteria 0{i+1}</span>
                <input type="text" value={evalConfig[c+'Name']} onChange={(e) => setEvalConfig({...evalConfig, [c+'Name']: e.target.value})} className="w-full text-sm border-gray-300 rounded-lg shadow-sm mb-2" placeholder="Name" />
                <input type="number" value={evalConfig[c+'Max']} onChange={(e) => setEvalConfig({...evalConfig, [c+'Max']: e.target.value})} className="w-full text-sm border-gray-300 rounded-lg shadow-sm" placeholder="Max" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveEvaluation} disabled={savingCriteria} className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {savingCriteria ? 'Saving...' : <><SaveIcon /> Save Config</>}
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