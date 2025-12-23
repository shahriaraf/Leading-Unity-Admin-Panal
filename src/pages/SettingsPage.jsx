import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Icons ---
const DownloadIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const TableIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/settings');
      setIsRegistrationOpen(data.isStudentRegistrationOpen);
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

  const toggleHandler = async () => {
    const previousState = isRegistrationOpen;
    setIsRegistrationOpen(!isRegistrationOpen);

    try {
      await axios.patch('https://leading-unity-backend.vercel.app/api/settings/toggle-registration', {}, getAuthConfig());
      toast.success(
        `Registration is now ${!previousState ? 'OPEN' : 'CLOSED'}`, 
        { 
          icon: !previousState ? '🔓' : '🔒',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        }
      );
    } catch (error) {
      setIsRegistrationOpen(previousState);
      toast.error("Failed to update setting",error);
    }
  };

  // 🟢 EXCEL EXPORT (Wrapped Text + Auto Row Height)
  const handleDownloadReport = async () => {
    setExporting(true);
    const toastId = toast.loading("Generating report...");

    try {
      const config = getAuthConfig();
      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/proposals', config);

      if (!data || data.length === 0) {
        toast.dismiss(toastId);
        toast.error("No data available to export.");
        setExporting(false);
        return;
      }

      // 1. Initialize Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Submissions');

      // 2. Define Columns with Fixed Widths
      // The width acts as a boundary. If text is longer, it wraps down.
      worksheet.columns = [
        { header: 'Course', key: 'courseCode', width: 12 },
        { header: 'Course Title', key: 'courseTitle', width: 20 },
        { header: 'Project Title', key: 'title', width: 25 },
        { header: 'Drive Link', key: 'description', width: 45 },
        { header: 'Submitted By', key: 'leaderName', width: 30 },
        { header: 'Team Members', key: 'teamMembers', width: 30 }, // Wide column for list
        { header: 'Supervisors', key: 'supervisors', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Supervisor', key: ' ', width: 20 },
      ];

      // 3. Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark Gray
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 4. Add Data Rows
      data.forEach((item) => {
        // 🟢 Use '\r\n' for new lines inside Excel cells
        const teamString = item.teamMembers 
          ? item.teamMembers.map(m => `• ${m.name} (${m.studentId}) \n email: ${m.email}`).join('\r\n') 
          : 'None';

        const supervisorString = item.supervisors 
          ? item.supervisors.map((s, i) => `${i+1}. ${s.name}`).join('\r\n') 
          : 'None';

        worksheet.addRow({
          courseCode: item.course?.courseCode || 'N/A',
          courseTitle: item.course?.courseTitle || 'N/A',
          title: item.title,
          description: item.description,
          leaderName: item.student?.name || 'N/A',
          leaderId: item.student?.studentId || 'N/A',
          teamMembers: teamString,
          supervisors: supervisorString,
          status: item.status.toUpperCase(),
          date: new Date(item.createdAt).toLocaleDateString(),
        });
      });

      // 🟢 5. Apply Text Wrapping & Borders to all Data Cells
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        row.eachCell((cell) => {
          // Alignment: Wrap Text triggers the row height expansion
          cell.alignment = { 
            vertical: 'top', 
            horizontal: 'left', 
            wrapText: true 
          };
          
          // Borders: Makes it easier to see where rows start/end
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
        });
      });

      // 6. Generate and Download
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
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage global configurations and export data.</p>
      </div>

      {/* Settings Grid */}
      <div className="max-w-3xl grid gap-6">
        
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
              <p className="text-sm text-gray-500 leading-relaxed">
                Control access to the mobile app sign-up process.
              </p>
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

        {/* --- Card 2: Data Management (Excel Export) --- */}
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
                Download a styled Excel report. Rows will automatically expand to fit list content (Team Members, Supervisors).
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