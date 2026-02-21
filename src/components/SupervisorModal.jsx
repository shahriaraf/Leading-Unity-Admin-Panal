import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupervisorModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState(''); // NEW
  const [designation, setDesignation] = useState('');   // NEW
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setAbbreviation('');
      setDesignation('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // 🟢 Updated Payload: Matches Backend DTO
      const payload = {
        name,
        abbreviation: abbreviation.trim().toUpperCase(), // e.g. "MRA"
        designation, // e.g. "Lecturer"
        password
      };

      await axios.post('https://leading-unity-nest-backend.vercel.app/api/users/supervisor', payload, config);
      
      onSuccess(); // Trigger parent refresh
      onClose();   // Close modal
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create supervisor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-50 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Supervisor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md text-sm" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Full Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="e.g. Dr. John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Row: Abbreviation & Designation */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-gray-700 text-sm font-semibold mb-1">Abbreviation</label>
              <input
                type="text" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} required
                placeholder="e.g. MRA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 text-sm font-semibold mb-1">Designation</label>
              <input
                type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} required
                placeholder="e.g. Lecturer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Temporary Password */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Temporary Password</label>
            <input
              type="text" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="Min 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-8">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating...
                </>
              ) : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupervisorModal;