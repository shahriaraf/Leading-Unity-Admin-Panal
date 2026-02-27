import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// --- BD Timezone Helpers ---
const toBDDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  const bdOffset = 6 * 60; 
  const localOffset = date.getTimezoneOffset();
  const diff = bdOffset + localOffset;
  return new Date(date.getTime() + diff * 60 * 1000);
};

const fromBDToUTC = (bdDate) => {
  if (!bdDate) return null;
  const bdOffset = 6 * 60;
  const localOffset = bdDate.getTimezoneOffset();
  const diff = bdOffset + localOffset;
  return new Date(bdDate.getTime() - diff * 60 * 1000);
};

// --- Icons ---
const SearchIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TeamIcon = () => <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const AssignIcon = () => <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LinkIcon = () => <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const XIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const RestoreIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const EmptyStateIcon = () => <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CalendarIcon = () => <svg className="w-3.5 h-3.5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

// Inject global styles
const GlobalDatePickerStyles = () => (
  <style>{`
    .react-datepicker-popper { z-index: 9999 !important; }
    .react-datepicker { font-family: inherit; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); overflow: hidden; }
    .react-datepicker__header { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding-top: 10px; }
    .react-datepicker__day--selected { background-color: #6366f1 !important; border-radius: 6px; }
    .defense-datepicker-wrapper { width: 100%; }
    .defense-datepicker-wrapper .react-datepicker-wrapper { width: 100%; }
    .defense-datepicker-wrapper .react-datepicker__input-container { width: 100%; }
  `}</style>
);

const SubmissionsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [coursesList, setCoursesList] = useState([]); // List of unique courses
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all'); // New Course Filter

  const getAuthHeader = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch { return {}; }
  };

  const fetchData = async () => {
    try {
      const config = getAuthHeader();
      const proposalsRes = await axios.get('https://leading-unity-nest-backend.vercel.app/api/proposals', config);
      const usersRes = await axios.get('https://leading-unity-nest-backend.vercel.app/api/users', config);
      
      const supervisors = usersRes.data.filter(u => u.role === 'supervisor');
      setAllSupervisors(supervisors);

      const data = proposalsRes.data;
      
      // Extract unique courses for dropdown
      const uniqueCourses = [...new Set(data.map(p => p.course?.courseCode).filter(Boolean))];
      setCoursesList(uniqueCourses);

      const sorted = sortProposals(data);
      setProposals(sorted);
      setFilteredProposals(sorted);

    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to Sort: Dates First (Ascending), then Nulls
  const sortProposals = (list) => {
    return [...list].sort((a, b) => {
      if (!a.defenseDate) return 1;
      if (!b.defenseDate) return -1;
      return new Date(a.defenseDate) - new Date(b.defenseDate);
    });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = proposals;

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Filter by Course (New)
    if (courseFilter !== 'all') {
      result = result.filter(p => p.course?.courseCode === courseFilter);
    }

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) ||
        p.course?.courseCode.toLowerCase().includes(lowerTerm) ||
        p.student?.name.toLowerCase().includes(lowerTerm) ||
        p.student?.studentId.includes(lowerTerm)
      );
    }
    
    setFilteredProposals(sortProposals(result));
  }, [searchTerm, statusFilter, courseFilter, proposals]); // Added courseFilter dependency

  const handleStatusChange = async (id, newStatus) => {
    const promise = axios.put(
      `https://leading-unity-nest-backend.vercel.app/api/proposals/${id}`, 
      { status: newStatus }, 
      getAuthHeader()
    );
    toast.promise(promise, {
      loading: 'Updating...',
      success: <span>Marked as <b>{newStatus}</b>!</span>,
      error: <b>Failed.</b>,
    }, { style: { minWidth: '250px', background: '#333', color: '#fff', borderRadius: '8px' }});
    try { await promise; fetchData(); } catch (error) { console.error(error); }
  };

  const handleAssignSupervisor = async (proposalId, supervisorId) => {
    const updated = proposals.map(p => {
        if(p._id === proposalId) {
            const supObj = allSupervisors.find(s => s._id === supervisorId);
            return { ...p, assignedSupervisor: supObj }; 
        }
        return p;
    });
    setProposals(updated);
    
    try {
        await axios.put(
            `https://leading-unity-nest-backend.vercel.app/api/proposals/${proposalId}/assign-supervisor`,
            { supervisorId },
            getAuthHeader()
        );
        toast.success("Assigned!");
    } catch (error) {
        toast.error("Failed", error);
        fetchData();
    }
  };

  const handleDateChange = async (bdDate, proposalId) => {
    const utcDate = fromBDToUTC(bdDate);
    const updated = proposals.map(p => 
      p._id === proposalId ? { ...p, defenseDate: utcDate.toISOString() } : p
    );
    // Sort immediately
    const sorted = sortProposals(updated);
    setProposals(sorted);
    setFilteredProposals(sorted);

    try {
      await axios.put(
        `https://leading-unity-nest-backend.vercel.app/api/proposals/${proposalId}/defense-date`,
        { date: utcDate.toISOString() },
        getAuthHeader()
      );
      toast.success("Schedule Updated");
    } catch (error) {
      toast.error("Failed to schedule",error);
      fetchData();
    }
  };


  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50/30 font-sans">
      <GlobalDatePickerStyles />
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Submissions</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Manage project proposals, supervisors, and defense schedules.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* SEARCH */}
          <div className="relative group min-w-[240px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text" placeholder="Search..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-700"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* COURSE FILTER */}
          <div className="relative min-w-[140px]">
            <select
              value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Courses</option>
              {coursesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* STATUS FILTER */}
          <div className="relative min-w-[120px]">
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-4 text-xs font-semibold tracking-wide text-center text-gray-500 uppercase w-12">#</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Project</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Team Members</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Defense Schedule</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Assign Supervisor</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-center text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="w-6 h-6 bg-gray-100 rounded-full mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-gray-100 rounded mb-2"></div><div className="w-20 h-3 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-40 h-4 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-6 mx-auto bg-gray-100 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-8 h-8 ml-auto bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <EmptyStateIcon />
                      <p className="text-lg font-medium text-gray-600">No submissions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal, index) => (
                  <tr key={proposal._id} className="group hover:bg-gray-50/80 transition-colors duration-150">
                    
                    {/* Serial No */}
                    <td className="px-4 py-4 text-center">
                        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                    </td>

                    {/* Project */}
                    <td className="px-6 py-4 align-top max-w-[250px]">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono tracking-wide">
                          {proposal.course?.courseCode || 'N/A'}
                        </span>
                        <div className="text-sm font-semibold text-gray-900 leading-snug break-words">{proposal.title}</div>
                        <a href={proposal.description} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors mt-1">
                          <LinkIcon /> View Proposal
                        </a>
                      </div>
                    </td>

                    {/* Team Members */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {/* Leader */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                           <TeamIcon /> 
                           <span>{proposal.student?.name} <span className="text-indigo-500 font-bold">(L)</span></span>
                        </div>
                        {/* Other Members */}
                        {proposal.teamMembers?.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 pl-0.5">
                            <span className="w-3 h-px bg-gray-300"></span>
                            <span>{member.name} <span className="text-gray-400">({member.studentId})</span></span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Defense Schedule */}
                    <td className="px-6 py-4 align-top">
                       {proposal.status === 'approved' ? (
                         <div className="defense-datepicker-wrapper relative w-[180px]">
                            <DatePicker
                                selected={proposal.defenseDate ? toBDDate(proposal.defenseDate) : null}
                                onChange={(date) => handleDateChange(date, proposal._id)}
                                showTimeSelect
                                timeFormat="hh:mm aa"
                                timeIntervals={15}
                                dateFormat="MMM d, yyyy h:mm aa"
                                placeholderText="Set Date & Time"
                                timeCaption="BD Time"
                                popperProps={{ strategy: "fixed" }}
                                className="block w-full py-2 pl-8 pr-2 text-xs font-medium border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-700 cursor-pointer bg-white"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                               <CalendarIcon />
                            </div>
                         </div>
                       ) : (
                         <span className="text-xs text-gray-400 italic">--</span>
                       )}
                    </td>

                    {/* Assigned Supervisor */}
                    <td className="px-6 py-4 align-top w-[200px]">
                       {proposal.status === 'approved' ? (
                           <div className="relative">
                               <select 
                                 className={`
                                   block w-full py-2 pl-3 pr-8 text-xs font-medium border rounded-lg shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all
                                   ${proposal.assignedSupervisor ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}
                                 `}
                                 value={proposal.assignedSupervisor?._id || ""}
                                 onChange={(e) => handleAssignSupervisor(proposal._id, e.target.value)}
                               >
                                  <option value="" disabled>Select</option>
                                  {allSupervisors.map(sup => {
                                      const isPreferred = proposal.supervisors?.some(s => s._id === sup._id);
                                      return (
                                          <option key={sup._id} value={sup._id} className={isPreferred ? "font-bold text-indigo-600 bg-indigo-50" : "text-gray-700"}>
                                              {sup.abbreviation || sup.name} {isPreferred ? '(Pref)' : ''}
                                          </option>
                                      );
                                  })}
                               </select>
                               <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                                  {proposal.assignedSupervisor ? <AssignIcon /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
                               </div>
                           </div>
                       ) : (
                           <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                             Approval Required
                           </span>
                       )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center align-top whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        proposal.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        proposal.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {proposal.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right align-top whitespace-nowrap">
                        {proposal.status !== 'rejected' ? (
                          <button 
                            onClick={() => handleStatusChange(proposal._id, 'rejected')} 
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            title="Reject"
                          >
                            <XIcon />
                          </button>
                        ) : (
                           <button 
                             onClick={() => handleStatusChange(proposal._id, 'approved')} 
                             className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                             title="Approve / Restore"
                           >
                             <RestoreIcon />
                           </button>
                        )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between items-center">
           <span>Showing {filteredProposals.length} submissions</span>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;