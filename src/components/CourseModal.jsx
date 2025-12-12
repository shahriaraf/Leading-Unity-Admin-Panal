// frontend/src/components/CourseModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseModal = ({ isOpen, onClose, onSuccess }) => {
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCourseCode('');
      setCourseTitle('');
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
      
      await axios.post('http://localhost:5000/api/courses', { courseCode, courseTitle }, config);
      onSuccess(); // Triggers a data refresh in the parent component
      onClose();   // Closes the modal on success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal Container */}
      <div className="z-50 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Add New Course</h2>
        
        {error && <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="courseCode">Course Code</label>
            <input
              id="courseCode" type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required
              placeholder="e.g., CSE499"
              className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="courseTitle">Course Title</label>
            <input
              id="courseTitle" type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required
              placeholder="e.g., Project / Thesis"
              className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 font-bold text-gray-800 transition-colors bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 font-bold text-white transition-colors bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;