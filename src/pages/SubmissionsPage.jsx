import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// --- Icons ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const StudentIcon = () => <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SupervisorIcon = () => <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const AssignIcon = () => <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LinkIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const XIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const RestoreIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const SubmissionsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- API HELPER ---
  const getAuthHeader = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
  };

  const fetchProposals = async () => {
    try {
      const { data } = await axios.get('https://leading-unity-nest-backend.vercel.app/api/proposals', getAuthHeader());
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

  // --- HANDLER: Status Change ---
  const handleStatusChange = async (id, newStatus) => {
    const promise = axios.put(
      `https://leading-unity-nest-backend.vercel.app/api/proposals/${id}`, 
      { status: newStatus }, 
      getAuthHeader()
    );

    toast.promise(promise, {
      loading: 'Updating status...',
      success: <span>Proposal marked as <b>{newStatus}</b>!</span>,
      error: <b>Failed to update status.</b>,
    }, {
      style: { minWidth: '250px', background: '#333', color: '#fff', borderRadius: '8px' },
    });

    try {
      await promise;
      fetchProposals();
    } catch (error) { console.error(error); }
  };

  // --- HANDLER: Assign Supervisor ---
  const handleAssignSupervisor = async (proposalId, supervisorId) => {
    // Optimistic UI Update: immediately update state to feel snappy
    const updated = proposals.map(p => {
        if(p._id === proposalId) {
            // Find full supervisor object from preferences to update UI correctly locally
            const supObj = p.supervisors.find(s => s._id === supervisorId);
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
        toast.success("Supervisor assigned successfully!");
    } catch (error) {
        toast.error("Failed to assign supervisor");
        fetchProposals(error); // Revert on error
    }
  };

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
    <div className="min-h-screen p-0 lg:p-8 bg-gray-50/50">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Submissions</h1>
          <p className="mt-2 text-sm text-gray-500">Manage student project proposals and assign supervisors.</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-6 md:mt-0 md:flex-row">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></div>
            <input
              type="text" placeholder="Search..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-10 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Project</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Team</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Preferred Supervisors</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Assigned Supervisor</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-3/4 h-4 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-full h-8 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 mx-auto bg-gray-100 rounded w-14"></div></td>
                    <td className="px-6 py-4"><div className="h-8 mx-auto bg-gray-100 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredProposals.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-400">No proposals found</td></tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal._id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                    
                    {/* Project */}
                    <td className="px-6 py-5 align-top w-1/5">
                      <div className="flex flex-col gap-2.5">
                        <span className="inline-flex self-start px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">{proposal.course?.courseCode}</span>
                        <div className="text-sm font-bold text-gray-900 leading-snug">{proposal.title}</div>
                        <a href={proposal.description.startsWith('http') ? proposal.description : `https://${proposal.description}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors mt-1"><LinkIcon /> Open Drive Link</a>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="px-6 py-5 align-top w-1/5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-100 w-fit pr-3">
                           <div className="p-1 bg-white rounded shadow-sm"><StudentIcon /></div>
                           <div>
                              <p className="text-xs font-bold text-gray-800">{proposal.student?.name}</p>
                              <p className="text-[10px] text-gray-500">{proposal.student?.studentId}</p>
                           </div>
                        </div>
                        {proposal.teamMembers?.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 ml-2 pl-3 border-l-2 border-gray-100">
                            <StudentIcon />
                            <div><p className="text-xs font-medium text-gray-700">{member.name}</p><p className="text-[10px] text-gray-400">{member.studentId}</p></div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Preferred Supervisors */}
                    <td className="px-6 py-5 align-top w-1/5">
                      <div className="flex flex-col gap-2">
                        {proposal.supervisors?.map((sup, index) => (
                            <div key={index} className="flex items-center gap-2.5 opacity-70">
                              <SupervisorIcon />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700">{sup.name}</span>
                                <span className="text-[10px] text-gray-400">Pref {index + 1}</span>
                              </div>
                            </div>
                        ))}
                      </div>
                    </td>

                    {/* Assigned Supervisor (Select) */}
                    <td className="px-6 py-5 align-top w-1/5">
                       {proposal.status === 'approved' ? (
                           <div className="relative">
                               <select 
                                 className={`
                                   block w-full py-2 pl-3 pr-8 text-xs font-semibold border rounded-lg shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all
                                   ${proposal.assignedSupervisor ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-500 italic'}
                                 `}
                                 value={proposal.assignedSupervisor?._id || ""}
                                 onChange={(e) => handleAssignSupervisor(proposal._id, e.target.value)}
                               >
                                  <option value="" disabled>Select Supervisor...</option>
                                  {proposal.supervisors?.map(sup => (
                                      <option key={sup._id} value={sup._id}>
                                          {sup.name}
                                      </option>
                                  ))}
                                  {/* Optional: Add separator and list all other supervisors if needed, but usually stick to preferences */}
                               </select>
                               
                               {/* Custom Arrow or Icon */}
                               <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                  {proposal.assignedSupervisor ? <AssignIcon /> : <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
                               </div>
                           </div>
                       ) : (
                           <span className="text-xs text-gray-400 italic">Approve first to assign</span>
                       )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 text-center align-top">{getStatusBadge(proposal.status)}</td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-center align-middle">
                        {proposal.status !== 'rejected' ? (
                          <button onClick={() => handleStatusChange(proposal._id, 'rejected')} className="flex items-center justify-center w-full px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 shadow-sm"><XIcon /> Reject</button>
                        ) : (
                           <button onClick={() => handleStatusChange(proposal._id, 'approved')} className="flex items-center justify-center w-full px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 shadow-sm"><RestoreIcon /> Restore</button>
                        )}
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