import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const getAuthHeader = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
};

const SupervisorModal = ({ isOpen, onClose, onSuccess, supervisorToEdit }) => {
  const [name,         setName]         = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [designation,  setDesignation]  = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const isEdit = !!supervisorToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setName(supervisorToEdit.name         ?? '');
      setAbbreviation(supervisorToEdit.abbreviation ?? '');
      setDesignation(supervisorToEdit.designation  ?? '');
      setEmail(supervisorToEdit.email        ?? '');
      setPassword(''); // never pre-fill password
    } else {
      setName(''); setAbbreviation(''); setDesignation('');
      setEmail(''); setPassword('');
    }
    setShowPassword(false);
  }, [isOpen, supervisorToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEdit) {
        // Build payload with only changed / non-empty fields
        const payload = {};
        if (name)         payload.name         = name;
        if (abbreviation) payload.abbreviation = abbreviation;
        if (designation)  payload.designation  = designation;
        if (email)        payload.email        = email;
        if (password)     payload.password     = password; // only if admin typed a new one

        await axios.patch(
          `${API_BASE}/users/supervisor/${supervisorToEdit._id}`,
          payload,
          getAuthHeader(),
        );
        toast.success('Supervisor updated successfully!');
      } else {
        await axios.post(
          `${API_BASE}/users/supervisor`,
          { name, abbreviation, designation, email, password },
          getAuthHeader(),
        );
        toast.success('Supervisor created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const fields = [
    { label: 'Full Name',     value: name,         setter: setName,         placeholder: 'e.g. Dr. John Smith',   type: 'text'  },
    { label: 'Abbreviation',  value: abbreviation, setter: setAbbreviation, placeholder: 'e.g. JHS',              type: 'text'  },
    { label: 'Designation',   value: designation,  setter: setDesignation,  placeholder: 'e.g. Assistant Professor', type: 'text' },
    { label: 'Email Address', value: email,        setter: setEmail,        placeholder: 'e.g. john@university.edu', type: 'email' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 m-4">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? 'Edit Supervisor' : 'Add New Supervisor'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? 'Update the supervisor details below. Leave password blank to keep it unchanged.'
                : 'Fill in the details for the new supervisor.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Standard fields */}
          {fields.map(({ label, value, setter, placeholder, type }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={value}
                placeholder={placeholder}
                required={!isEdit} // required only on create
                onChange={(e) => setter(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
              />
            </div>
          ))}

          {/* Password field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
              {isEdit && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  — leave blank to keep current
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder={isEdit ? '••••••••' : 'Minimum 6 characters'}
                required={!isEdit}
                minLength={password ? 6 : undefined}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder-gray-400 text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Save Changes' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupervisorModal;