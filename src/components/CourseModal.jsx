import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const getAuthHeader = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
};

const CourseModal = ({ isOpen, onClose, onSuccess, courseToEdit, allCourses = [] }) => {
  const [courseCode,     setCourseCode]     = useState('');
  const [courseTitle,    setCourseTitle]    = useState('');
  const [linkedCourseId, setLinkedCourseId] = useState('');
  const [isLoading,      setIsLoading]      = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCourseCode(courseToEdit?.courseCode   ?? '');
    setCourseTitle(courseToEdit?.courseTitle ?? '');
    // linkedCourseId may be a populated object or a plain id string
    const linked = courseToEdit?.linkedCourseId;
    setLinkedCourseId(linked ? (linked._id ?? linked) : '');
  }, [isOpen, courseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      courseCode,
      courseTitle,
      linkedCourseId: linkedCourseId || null,
    };
    try {
      if (courseToEdit) {
        await axios.put(`${API_BASE}/courses/${courseToEdit._id}`, payload, getAuthHeader());
        toast.success('Course updated successfully!');
      } else {
        await axios.post(`${API_BASE}/courses`, payload, getAuthHeader());
        toast.success('Course added successfully!');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  const isEdit = !!courseToEdit;

  // Don't show the current course as a link option (can't link to itself)
  const linkOptions = allCourses.filter((c) => c._id !== courseToEdit?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 m-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0d2331]">
              {isEdit ? 'Edit Course' : 'Add New Course'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update the course details below' : 'Fill in the details for the new course'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Code</label>
            <input
              type="text" value={courseCode} placeholder="e.g. CSE-4200" required
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800 uppercase placeholder:normal-case"
            />
          </div>

          {/* Course Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Title</label>
            <input
              type="text" value={courseTitle} placeholder="e.g. Thesis Part I" required
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Linked Course (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Carry Forward To
              <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={linkedCourseId}
              onChange={(e) => setLinkedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
            >
              <option value="">— None —</option>
              {linkOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} — {c.courseTitle}
                </option>
              ))}
            </select>
            {linkedCourseId && (
              <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proposals from this course can be carried forward to the selected course.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0d2331] rounded-lg hover:bg-[#16344d] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;