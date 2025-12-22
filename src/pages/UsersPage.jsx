import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import SupervisorModal from '../components/SupervisorModal';

// --- Icons ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MailIcon = () => <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UserGroupIcon = () => <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      // ✅ Updated URL
      const { data } = await axios.get('http://localhost:5000/api/users', config);
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = users;

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.email.toLowerCase().includes(lower)
      );
    }

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  const deleteHandler = async (id) => {

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    
    // ✅ Toast Promise
    const promise = axios.delete(`http://localhost:5000/api/users/${id}`, config);

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: 'User removed successfully!',
      error: 'Could not delete user.',
    }, { style: { background: '#333', color: '#fff' } });

    try {
      await promise;
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  // Helper: Generate Initials for Avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen p-0 lg:p-8 bg-gray-50/50">
      <Toaster position="top-right" />

      {/* --- Header --- */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
          <p className="mt-2 text-sm text-gray-500">Manage students and supervisors.</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-6 md:mt-0 md:flex-row lg:items-center">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all group-hover:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="supervisor">Supervisors</option>
            <option value="student">Students</option>
          </select>

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white transition-all bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <PlusIcon /> Add Supervisor
          </button>
        </div>
      </div>

      {/* --- Table Content --- */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                // Loading Skeleton
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-gray-100 mr-3"></div><div className="w-32 h-4 bg-gray-100 rounded"></div></div></td>
                    <td className="px-6 py-4"><div className="w-40 h-4 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4 text-center"><div className="inline-block w-20 h-6 bg-gray-100 rounded-full"></div></td>
                    <td className="px-6 py-4 text-right"><div className="inline-block w-8 h-8 bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                 <tr>
                   <td colSpan="4" className="px-6 py-16 text-center text-gray-400">
                     <div className="flex flex-col items-center justify-center">
                       <UserGroupIcon />
                       <p className="text-lg font-medium text-gray-500">No users found</p>
                       <p className="text-sm">Try adjusting your filters.</p>
                     </div>
                   </td>
                 </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                    
                    {/* User Name & Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {getInitials(user.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {user.name}
                          </div>
                          {user.studentId && (
                            <div className="text-xs text-gray-500">ID: {user.studentId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact (Email) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <MailIcon />
                        {user.email}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        user.role === 'supervisor' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200' 
                          : 'bg-teal-100 text-teal-700 border-teal-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => deleteHandler(user._id)} 
                        className="p-2 text-gray-400 transition-colors bg-white border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm"
                        title="Delete User"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Injection */}
      <SupervisorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          setIsModalOpen(false); // Ensure modal closes
        }}
      />
    </div>
  );
};

export default UsersPage;