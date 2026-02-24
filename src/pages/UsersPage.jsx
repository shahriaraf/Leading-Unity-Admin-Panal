import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import SupervisorModal from '../components/SupervisorModal';

// --- Icons ---
const SearchIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MailIcon = () => <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const BadgeIcon = () => <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EmptyStateIcon = () => <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      
      const { data } = await axios.get('https://leading-unity-nest-backend.vercel.app/api/users', config);
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

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        (u.email && u.email.toLowerCase().includes(lower)) ||
        (u.abbreviation && u.abbreviation.toLowerCase().includes(lower)) ||
        (u.studentId && u.studentId.includes(lower))
      );
    }
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  const deleteHandler = async (id) => {
    if(!window.confirm("Are you sure you want to delete this user?")) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    
    const promise = axios.delete(`https://leading-unity-nest-backend.vercel.app/api/users/${id}`, config);

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: 'User removed successfully!',
      error: 'Could not delete user.',
    }, { style: { background: '#333', color: '#fff', borderRadius: '8px' } });

    try {
      await promise;
      fetchUsers();
    } catch (error) { console.error(error); }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <Toaster position="top-right" />

      {/* --- Header Section --- */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Manage student and supervisor accounts.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-10 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="supervisor">Supervisors</option>
              <option value="student">Students</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-95 whitespace-nowrap"
          >
            <PlusIcon /> Add Supervisor
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Identity</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase">Contact / Info</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-center text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // Skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-100 rounded-full"></div><div className="space-y-2"><div className="w-24 h-3 bg-gray-100 rounded"></div><div className="w-16 h-2 bg-gray-100 rounded"></div></div></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-3 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4 text-center"><div className="inline-block w-16 h-5 bg-gray-100 rounded-full"></div></td>
                    <td className="px-6 py-4 text-right"><div className="inline-block w-6 h-6 bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                 <tr>
                   <td colSpan="4" className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center justify-center text-gray-400">
                       <EmptyStateIcon />
                       <p className="text-lg font-medium text-gray-600">No users found</p>
                       <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                     </div>
                   </td>
                 </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="group hover:bg-gray-50/80 transition-colors duration-150">
                    
                    {/* User Identity */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`
                          flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm
                          ${user.role === 'supervisor' ? 'bg-indigo-600' : 'bg-teal-500'}
                        `}>
                          {getInitials(user.name)}
                        </div>
                        <div className="ml-3.5">
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 font-medium">
                            {user.role === 'student' ? `ID: ${user.studentId}` : user.designation}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Details Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'supervisor' ? (
                        <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100/50 px-2.5 py-1 rounded-md w-fit border border-gray-100">
                           <BadgeIcon />
                           <span className="tracking-wide">{user.abbreviation}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center text-sm text-gray-600">
                             <MailIcon />
                             {user.email}
                           </div>
                           <div className="text-xs text-gray-400 pl-5">
                             Batch {user.batch} • Sec {user.section}
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${
                        user.role === 'supervisor' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-teal-50 text-teal-700 border-teal-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => deleteHandler(user._id)} 
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
        
        {/* Footer (Pagination Placeholder) */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between items-center">
           <span>Showing {filteredUsers.length} users</span>
           {/* Pagination controls could go here */}
        </div>
      </div>

      <SupervisorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { fetchUsers(); setIsModalOpen(false); }}
      />
    </div>
  );
};

export default UsersPage;