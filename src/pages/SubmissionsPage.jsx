import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubmissionsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Proposals
  const fetchProposals = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/proposals', config);
      setProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Handle Status Update (Approve/Reject)
  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this proposal?`)) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      await axios.put(
        `https://leading-unity-backend.vercel.app/api/proposals/${id}`,
        { status: newStatus },
        config
      );
      
      fetchProposals(); // Refresh UI
    } catch (error) {
      alert("Failed to update status");
      console.error(error);
    }
  };

  // Helper to format status color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Rejected</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Student Submissions</h1>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-left uppercase">Course</th>
              <th className="px-4 py-3 text-sm font-medium text-left uppercase">Title & Link</th>
              <th className="px-4 py-3 text-sm font-medium text-left uppercase">Leader</th>
              <th className="px-4 py-3 text-sm font-medium text-left uppercase">Team Members</th>
              <th className="px-4 py-3 text-sm font-medium text-left uppercase">Supervisors (Pref)</th>
              <th className="px-4 py-3 text-sm font-medium text-center uppercase">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-center uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {loading ? (
              <tr><td colSpan="7" className="py-6 text-center text-lg">Loading submissions...</td></tr>
            ) : proposals.length === 0 ? (
              <tr><td colSpan="7" className="py-6 text-center text-lg">No submissions found.</td></tr>
            ) : (
              proposals.map((proposal) => (
                <tr key={proposal._id} className="border-b border-gray-200 hover:bg-gray-50 align-top">
                  
                  {/* Course Code */}
                  <td className="px-4 py-4 font-mono font-bold whitespace-nowrap">
                    {proposal.course?.courseCode || 'N/A'}
                  </td>

                  {/* Title & Drive Link */}
                  <td className="px-4 py-4">
                    <div className="font-bold text-gray-900 mb-1">{proposal.title}</div>
                    <a 
                      href={proposal.description.startsWith('http') ? proposal.description : `https://${proposal.description}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      📂 Open Drive Link
                    </a>
                  </td>

                  {/* Leader Info */}
                  <td className="px-4 py-4">
                    <div className="font-semibold">{proposal.student?.name}</div>
                    <div className="text-xs text-gray-500">{proposal.student?.studentId}</div>
                  </td>

                  {/* Team Members */}
                  <td className="px-4 py-4">
                    {proposal.teamMembers && proposal.teamMembers.length > 0 ? (
                      <ul className="list-disc pl-4 text-xs space-y-1">
                        {proposal.teamMembers.map((member, index) => (
                          <li key={index}>
                            <span className="font-medium">{member.name}</span> <br/>
                            <span className="text-gray-500">({member.studentId})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No partners</span>
                    )}
                  </td>

                  {/* 🟢 UPDATED SUPERVISOR COLUMN (Handles List) */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {proposal.supervisors && proposal.supervisors.length > 0 ? (
                        proposal.supervisors.map((sup, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100 whitespace-nowrap">
                             {index + 1}. {sup.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No Preferences</span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4 text-center">
                    {getStatusBadge(proposal.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col space-y-2">
                      {proposal.status !== 'approved' && (
                        <button 
                          onClick={() => handleStatusChange(proposal._id, 'approved')}
                          className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                      )}
                      {proposal.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(proposal._id, 'rejected')}
                          className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 transition"
                        >
                          Reject
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
  );
};

export default SubmissionsPage;