import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Icons (Inline SVGs to avoid dependencies) ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const UserIcon = () => <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const UsersIcon = () => <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
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
    if (!window.confirm(`Are you sure you want to ${newStatus} this proposal?`)) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`https://leading-unity-backend.vercel.app/api/proposals/${id}`, { status: newStatus }, config);
      fetchProposals();
    } catch (error) {
      alert("Failed to update status", error);
    }
  };

  // Helper: Status Badge
  const getStatusBadge = (status) => {
    const styles = {
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and review student project proposals.</p>
        </div>
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-4 mt-4 md:mt-0 md:flex-row">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search title, ID, name..."
              className="block w-full py-2 pl-10 pr-3 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Project Info</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Team Structure</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Supervisors</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading Skeleton
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-3/4 h-4 bg-gray-200 rounded"></div><div className="w-1/2 h-3 mt-2 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 mx-auto bg-gray-200 rounded w-14"></div></td>
                    <td className="px-6 py-4"><div className="h-8 mx-auto bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-lg font-medium">No proposals found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal._id} className="transition-colors duration-150 hover:bg-gray-50/80">
                    
                    {/* Project Info Column */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex self-start px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {proposal.course?.courseCode || 'N/A'}
                        </span>
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                          {proposal.title}
                        </div>
                        <a 
                          href={proposal.description.startsWith('http') ? proposal.description : `https://${proposal.description}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <LinkIcon /> View Proposal
                        </a>
                      </div>
                    </td>

                    {/* Team Structure Column */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="space-y-3">
                        {/* Leader */}
                        <div className="flex items-start">
                           <div className="mt-0.5"><UserIcon /></div>
                           <div>
                              <p className="text-sm font-semibold text-gray-900">{proposal.student?.name}</p>
                              <p className="text-xs text-gray-500">{proposal.student?.studentId} <span className="text-indigo-600 font-medium">(Leader)</span></p>
                           </div>
                        </div>

                        {/* Members */}
                        {proposal.teamMembers && proposal.teamMembers.length > 0 && (
                          <div className="pl-1 border-l-2 border-gray-200 ml-1.5">
                            {proposal.teamMembers.map((member, index) => (
                              <div key={index} className="flex items-start mb-2 last:mb-0 pl-3">
                                <UsersIcon />
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

                    {/* Supervisors Column */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {proposal.supervisors && proposal.supervisors.length > 0 ? (
                          proposal.supervisors.map((sup, index) => (
                            <div key={index} className="flex items-center text-xs">
                              <span className="flex items-center justify-center w-5 h-5 mr-2 font-bold text-gray-500 bg-gray-100 rounded-full text-[10px]">
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-700">{sup.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">No Preferences</span>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 text-center align-top">
                      {getStatusBadge(proposal.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {proposal.status !== 'approved' && (
                          <button 
                            onClick={() => handleStatusChange(proposal._id, 'approved')}
                            className="flex items-center w-28 justify-center px-3 py-1.5 text-xs font-medium text-white transition-all bg-emerald-500 rounded-md hover:bg-emerald-600 shadow-sm hover:shadow active:scale-95"
                          >
                            <CheckIcon /> Approve
                          </button>
                        )}
                        {proposal.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusChange(proposal._id, 'rejected')}
                            className="flex items-center w-28 justify-center px-3 py-1.5 text-xs font-medium text-white transition-all bg-rose-500 rounded-md hover:bg-rose-600 shadow-sm hover:shadow active:scale-95"
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