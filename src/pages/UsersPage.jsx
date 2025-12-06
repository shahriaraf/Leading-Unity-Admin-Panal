// frontend/src/pages/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SupervisorModal from '../components/SupervisorModal'; // <-- 1. Import the new modal

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- 2. State to control the modal

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/users', config);
      setUsers(data || []); 
    } catch (error) {
      console.error("Failed to fetch users", error);
      // Optional: Add error handling for the user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.delete(`https://leading-unity-backend.vercel.app/api/users/${id}`, config);
        fetchUsers(); // Refresh the user list after deletion
      } catch (error) {
        console.error("Failed to delete user", error);
        alert('Could not delete user.');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        {/* 3. This button now just opens the modal */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-4 py-2 font-bold text-white transition-transform transform bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:scale-105"
        >
          + Add Supervisor
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {loading ? (
              <tr><td colSpan="4" className="py-4 text-center">Loading users...</td></tr>
            ) : users.map(user => (
              <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-left whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-3 text-left">{user.email}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                    user.role === 'supervisor' ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <button onClick={() => deleteHandler(user._id)} className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded hover:bg-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Render the modal component and pass props */}
      <SupervisorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchUsers(); // Refresh the list when a new supervisor is successfully added
        }}
      />
    </div>
  );
};

export default UsersPage;