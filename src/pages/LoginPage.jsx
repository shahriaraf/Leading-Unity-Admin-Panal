import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '/LeadUnity2.png';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('userInfo')) navigate('/');
  }, [navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { identifier: email, password });

      if (data.role !== 'admin') {
        setError('Access denied. Only admins can log in here.');
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
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
          {/* Logo image */}
          <div className="flex items-center justify-center mx-auto mb-8">
            <img
              src={logo}
              alt="LeadUnity"
              className="w-48 object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-[#8daab9] text-lg leading-relaxed max-w-sm">
            Manage students, supervisors, and project submissions from one unified dashboard.
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="LeadUnity" className="h-12 object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0d2331] tracking-tight">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your admin account</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-lg">
                <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email address</label>
                <input
                  id="email" type="email" value={email} required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">Password</label>
                <input
                  id="password" type="password" value={password} required
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                />
              </div>

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
                    Signing in...
                  </>
                ) : 'Sign in'}
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

export default LoginPage;