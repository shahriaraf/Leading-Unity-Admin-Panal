import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const AdminRegisterPage = () => {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/register/admin-secret`, { name, email, password });
      setSuccess(`Admin registered successfully! Email: ${data.email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#eef5f9]">

      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0d2331] flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-indigo-500/10" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-amber-400/20">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">LeadUnity</h1>
          <p className="text-[#8daab9] text-lg leading-relaxed max-w-sm">
            This page is for one-time admin account creation. Keep this URL private and secure.
          </p>

          {/* Warning notice */}
          <div className="mt-10 flex items-start gap-3 bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 text-left">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-amber-300/80 text-sm leading-relaxed">
              Restricted access. Only share this page with authorized personnel.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0d2331]">LeadUnity</h1>
            <p className="text-gray-500 text-sm mt-1">Admin Registration</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0d2331] tracking-tight">Create Admin</h2>
              <p className="text-gray-500 text-sm mt-1">Register a new administrator account</p>
            </div>

            {/* Feedback messages */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-lg">
                <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-emerald-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-5">
              {[
                { label: 'Full name',       id: 'name',     type: 'text',     value: name,     setter: setName,     placeholder: 'John Doe'             },
                { label: 'Email address',   id: 'email',    type: 'email',    value: email,    setter: setEmail,    placeholder: 'admin@example.com'    },
                { label: 'Password',        id: 'password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••'             },
              ].map(({ label, id, type, value, setter, placeholder }) => (
                <div key={id}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={id}>
                    {label}
                  </label>
                  <input
                    id={id} type={type} value={value} required placeholder={placeholder}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  />
                </div>
              ))}

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0d2331] text-white text-sm font-semibold rounded-lg hover:bg-[#16344d] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Registering...
                  </>
                ) : 'Register Admin'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            LeadUnity Admin Portal — Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;