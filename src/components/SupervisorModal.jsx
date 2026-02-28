import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const getAuthHeader = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
};

const INITIAL_FORM = { name: '', abbreviation: '', designation: '', password: '' };

const SupervisorModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) { setForm(INITIAL_FORM); setError(''); }
  }, [isOpen]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = { ...form, abbreviation: form.abbreviation.trim().toUpperCase() };

    try {
      await axios.post(`${API_BASE}/users/supervisor`, payload, getAuthHeader());
      onSuccess(); // Refresh parent list
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create supervisor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 m-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0d2331]">Add New Supervisor</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the supervisor's details below</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-lg">
            <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-rose-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text" value={form.name} onChange={set('name')} required
              placeholder="e.g. Dr. John Doe"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Abbreviation + Designation side by side */}
          <div className="flex gap-3">
            {[
              { label: 'Abbreviation', field: 'abbreviation', placeholder: 'e.g. MRA' },
              { label: 'Designation',  field: 'designation',  placeholder: 'e.g. Lecturer' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="w-1/2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text" value={form[field]} onChange={set(field)} required placeholder={placeholder}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
                />
              </div>
            ))}
          </div>

          {/* Temporary Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temporary Password</label>
            <input
              type="text" value={form.password} onChange={set('password')} required
              placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0d2331] rounded-lg hover:bg-[#16344d] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Creating...' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupervisorModal;