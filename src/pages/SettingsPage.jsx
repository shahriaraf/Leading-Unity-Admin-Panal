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

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);

  // New State for Evaluation Criteria
  const [evalConfig, setEvalConfig] = useState({
    criteria1Name: 'Problem Definition, Design & Viva',
    criteria1Max: 30,
    criteria2Name: 'Presentation, Testing & Report',
    criteria2Max: 30,
  });

  const API_URL = 'https://leading-unity-nest-backend.vercel.app/api';

  // Helper for Auth Header
  const getAuthConfig = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch (e) {
      return {e};
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/settings`);
      setIsRegistrationOpen(data.isStudentRegistrationOpen);
      
      // Populate Evaluation Config if exists, else defaults
      setEvalConfig({
        criteria1Name: data.criteria1Name || 'Criteria 1',
        criteria1Max: data.criteria1Max || 30,
        criteria2Name: data.criteria2Name || 'Criteria 2',
        criteria2Max: data.criteria2Max || 30,
      });

    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error("Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // --- HANDLER: Toggle Registration ---
  const toggleHandler = async () => {
    const previousState = isRegistrationOpen;
    setIsRegistrationOpen(!isRegistrationOpen);

    try {
      await axios.patch(`${API_URL}/settings/toggle-registration`, {}, getAuthConfig());
      toast.success(
        `Registration is now ${!previousState ? 'OPEN' : 'CLOSED'}`, 
        { 
          icon: !previousState ? '🔓' : '🔒',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        }
      );
    } catch (error) {
      setIsRegistrationOpen(previousState);
      toast.error("Failed to update setting", error);
    }
  };

  // --- HANDLER: Save Evaluation Settings ---
  const handleCriteriaChange = (e) => {
    setEvalConfig({ ...evalConfig, [e.target.name]: e.target.value });
  };

  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try {
      await axios.post(`${API_URL}/settings/evaluation`, evalConfig, getAuthConfig());
      toast.success("Evaluation criteria updated successfully!");
    } catch (error) {
      toast.error("Failed to save criteria settings.");
      console.error(error);
    } finally {
      setSavingCriteria(false);
    }
  };

  // --- HANDLER: Excel Export ---
  const handleDownloadReport = async () => {
    setExporting(true);
    const toastId = toast.loading("Generating report...");

    try {
      const config = getAuthConfig();
      const { data } = await axios.get(`${API_URL}/proposals`, config);

      if (!data || data.length === 0) {
        toast.dismiss(toastId);
        toast.error("No data available to export.");
        setExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Submissions');

      worksheet.columns = [
        { header: 'Course', key: 'courseCode', width: 12 },
        { header: 'Course Title', key: 'courseTitle', width: 20 },
        { header: 'Project Title', key: 'title', width: 25 },
        { header: 'Drive Link', key: 'description', width: 45 },
        { header: 'Submitted By', key: 'leaderName', width: 30 },
        { header: 'Team Members', key: 'teamMembers', width: 35 },
        { header: 'Supervisors', key: 'supervisors', width: 25 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Date', key: 'date', width: 12 },
        
        // Dynamic Columns based on settings
        { header: `${evalConfig.criteria1Name} (${evalConfig.criteria1Max})`, key: 'c1', width: 15 },
        { header: `${evalConfig.criteria2Name} (${evalConfig.criteria2Max})`, key: 'c2', width: 15 },
        { header: 'Total Marks', key: 'total', width: 15 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      data.forEach((item) => {
        const teamString = item.teamMembers 
          ? item.teamMembers.map(m => `• ${m.name} (${m.studentId})`).join('\r\n') 
          : 'None';

        const supervisorString = item.supervisors 
          ? item.supervisors.map((s, i) => `${i+1}. ${s.name}`).join('\r\n') 
          : 'None';

        // Logic for marks: In current backend, marks are stored in an array inside the proposal. 
        // For Excel report, we might need to average them or just show "Evaluated".
        // For simplicity here, we assume if marks exist, we show 'Evaluated' or calculate average.
        // Or if you want specific student marks, the report structure needs to change (one row per student).
        // For now, keeping it one row per team:
        const hasMarks = item.marks && item.marks.length > 0;

        worksheet.addRow({
          courseCode: item.course?.courseCode || 'N/A',
          courseTitle: item.course?.courseTitle || 'N/A',
          title: item.title,
          description: item.description,
          leaderName: item.student?.name || 'N/A',
          teamMembers: teamString,
          supervisors: supervisorString,
          status: item.status.toUpperCase(),
          date: new Date(item.createdAt).toLocaleDateString(),
          c1: hasMarks ? 'See Details' : '-',
          c2: hasMarks ? 'See Details' : '-',
          total: hasMarks ? 'See Details' : '-'
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Submissions_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer]), fileName);

      toast.success("Report downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Failed to generate report", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50/50">
      <Toaster position="top-right" />
      
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage global configurations, evaluation criteria, and export data.</p>
      </div>

      <div className="max-w-4xl grid gap-8">
        
        {/* --- Card 1: Student Registration --- */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6 transition-all hover:shadow-xl">
          <div className={`absolute top-0 left-0 w-full h-1 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-500`}></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isRegistrationOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} transition-colors duration-300`}>
                  <SettingsIcon />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Student Registration</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Control access to the mobile app sign-up process.</p>
              <div className="mt-4 flex items-center gap-2">
                {loading ? (
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${isRegistrationOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <span className={`w-2 h-2 rounded-full ${isRegistrationOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {isRegistrationOpen ? "Accepting Users" : "Registration Closed"}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
               {loading ? (
                 <div className="w-14 h-8 bg-gray-200 rounded-full animate-pulse"></div>
               ) : (
                <button
                  onClick={toggleHandler}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isRegistrationOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
               )}
            </div>
          </div>
        </div>

        {/* --- Card 2: Evaluation Criteria Configuration (NEW) --- */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6 transition-all hover:shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <GradingIcon />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Evaluation Criteria</h3>
              <p className="text-sm text-gray-500">Configure the criteria names and maximum marks for supervisor grading.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Criteria 1 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">Criteria 01</span>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input 
                    type="text" 
                    name="criteria1Name"
                    value={evalConfig.criteria1Name}
                    onChange={handleCriteriaChange}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
                  <input 
                    type="number" 
                    name="criteria1Max"
                    value={evalConfig.criteria1Max}
                    onChange={handleCriteriaChange}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500" 
                  />
                </div>
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">Criteria 02</span>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input 
                    type="text" 
                    name="criteria2Name"
                    value={evalConfig.criteria2Name}
                    onChange={handleCriteriaChange}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
                  <input 
                    type="number" 
                    name="criteria2Max"
                    value={evalConfig.criteria2Max}
                    onChange={handleCriteriaChange}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveEvaluation}
              disabled={savingCriteria}
              className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {savingCriteria ? (
                <span>Saving...</span>
              ) : (
                <>
                  <SaveIcon /> Save Configuration
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- Card 3: Data Export --- */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6 transition-all hover:shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <TableIcon />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Export Data</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Download a styled Excel report. Includes team details, supervisor assignments, and status.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={handleDownloadReport}
                disabled={exporting}
                className={`
                  flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white transition-all 
                  bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {exporting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <DownloadIcon /> Download Excel
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;