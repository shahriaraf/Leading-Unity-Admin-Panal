import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// --- Icons ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const StudentIcon = () => <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SupervisorIcon = () => <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; // Briefcase style for supervisor
const LinkIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const CheckIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const SubmissionsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchProposals = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/proposals', config);
      setProposals(data);
      setFilteredProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals", error);
      toast.error("Could not load proposals.", { style: { background: '#333', color: '#fff' }});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = proposals;

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) ||
        p.course?.courseCode.toLowerCase().includes(lowerTerm) ||
        p.student?.name.toLowerCase().includes(lowerTerm) ||
        p.student?.studentId.includes(lowerTerm)
      );
    }

    setFilteredProposals(result);
  }, [searchTerm, statusFilter, proposals]);

  const handleStatusChange = async (id, newStatus) => {
    // Custom toast for confirmation can be complex, using simple confirm for safety, then Toast for result
    if (!window.confirm(`Are you sure you want to ${newStatus} this proposal?`)) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    // Toast Promise handles Loading, Success, and Error states automatically
    const promise = axios.put(`https://leading-unity-backend.vercel.app/api/proposals/${id}`, { status: newStatus }, config);

    toast.promise(
      promise,
      {
        loading: 'Updating status...',
        success: (
          <span>Proposal marked as <b>{newStatus}</b>!</span>
        ),
        error: <b>Failed to update status.</b>,
      },
      {
        style: {
          minWidth: '250px',
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
        success: {
          iconTheme: {
            primary: newStatus === 'approved' ? '#10B981' : '#F43F5E',
            secondary: '#fff',
          },
        },
      }
    );

    try {
      await promise;
      fetchProposals();
    } catch (error) {
      console.error(error);
    }
  };

  // Helper: Status Badge
  const getStatusBadge = (status) => {
    const styles = {
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-rose-100 text-rose-800 border-rose-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50/50">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* --- Header Section --- */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Submissions</h1>
          <p className="mt-2 text-sm text-gray-500">Manage and review student project proposals.</p>
        </div>
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-4 mt-6 md:mt-0 md:flex-row">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all group-hover:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-10 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Project</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Team</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Supervisors</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                // Loading Skeleton
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-3/4 h-4 bg-gray-100 rounded"></div><div className="w-1/2 h-3 mt-2 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 mx-auto bg-gray-100 rounded w-14"></div></td>
                    <td className="px-6 py-4"><div className="h-8 mx-auto bg-gray-100 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-lg font-medium text-gray-500">No proposals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal._id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                    
                    {/* Project Info */}
                    <td className="px-6 py-5 align-top w-1/4">
                      <div className="flex flex-col gap-2.5">
                        <span className="inline-flex self-start px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 tracking-wide">
                          {proposal.course?.courseCode || 'N/A'}
                        </span>
                        <div className="text-sm font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                          {proposal.title}
                        </div>
                        <a 
                          href={proposal.description.startsWith('http') ? proposal.description : `https://${proposal.description}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors mt-1"
                        >
                          <LinkIcon /> Open Drive Link
                        </a>
                      </div>
                    </td>

                    {/* Team Structure */}
                    <td className="px-6 py-5 align-top w-1/4">
                      <div className="space-y-3">
                        {/* Leader */}
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100 w-fit pr-3">
                           <div className="p-1 bg-white rounded shadow-sm"><StudentIcon /></div>
                           <div>
                              <p className="text-xs font-bold text-gray-800">{proposal.student?.name} <span className="text-[10px] text-indigo-500 font-normal ml-1">Leader</span></p>
                              <p className="text-[10px] text-gray-500">{proposal.student?.studentId}</p>
                           </div>
                        </div>

                        {/* Members */}
                        {proposal.teamMembers && proposal.teamMembers.length > 0 && (
                          <div className="flex flex-col gap-2 ml-2 pl-3 border-l-2 border-gray-100">
                            {proposal.teamMembers.map((member, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <StudentIcon />
                                <div>
                                  <p className="text-xs font-medium text-gray-700">{member.name}</p>
                                  <p className="text-[10px] text-gray-400">{member.studentId}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Supervisors */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-2">
                        {proposal.supervisors && proposal.supervisors.length > 0 ? (
                          proposal.supervisors.map((sup, index) => (
                            <div key={index} className="flex items-center gap-2.5">
                              <SupervisorIcon />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700">{sup.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Priority {index + 1}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">No Preferences</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 text-center align-top">
                      {getStatusBadge(proposal.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {proposal.status !== 'approved' && (
                          <button 
                            onClick={() => handleStatusChange(proposal._id, 'approved')}
                            className="flex items-center justify-center w-full max-w-[100px] px-3 py-1.5 text-xs font-semibold text-white transition-all bg-emerald-500 rounded-lg hover:bg-emerald-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <CheckIcon /> Approve
                          </button>
                        )}
                        {proposal.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusChange(proposal._id, 'rejected')}
                            className="flex items-center justify-center w-full max-w-[100px] px-3 py-1.5 text-xs font-semibold text-white transition-all bg-rose-500 rounded-lg hover:bg-rose-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <XIcon /> Reject
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;