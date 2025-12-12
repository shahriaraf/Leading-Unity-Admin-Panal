import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper for Auth Header
  const getAuthConfig = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
    } catch (e) {
      return {};
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/settings');
      setIsRegistrationOpen(data.isStudentRegistrationOpen);
    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error("Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleHandler = async () => {
    // Optimistic UI Update (Change immediately for responsiveness)
    const previousState = isRegistrationOpen;
    setIsRegistrationOpen(!isRegistrationOpen);

    try {
      await axios.patch('https://leading-unity-backend.vercel.app/api/settings/toggle-registration', {}, getAuthConfig());
      toast.success(
        `Registration is now ${!previousState ? 'OPEN' : 'CLOSED'}`, 
        { 
          icon: !previousState ? '🔓' : '🔒',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        }
      );
    } catch (error) {
      // Revert if error
      setIsRegistrationOpen(previousState);
      toast.error("Failed to update setting");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50/50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage global configurations and access controls.</p>
      </div>

      {/* Settings Grid */}
      <div className="max-w-3xl grid gap-6">
        
        {/* Card: Student Registration */}
        <div className="relative overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl p-6 transition-all hover:shadow-xl">
          
          {/* Top colored line for visual accent */}
          <div className={`absolute top-0 left-0 w-full h-1 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-500`}></div>

          <div div className="flex items-center justify-between flex-col lg:flex-row gap-4">
            
            {/* Left Side: Text Info */}
            <div className="flex-1 pr-0 lg:pr-0">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isRegistrationOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} transition-colors duration-300`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Student Registration</h3>
              </div>
              
              <p className="text-sm text-gray-500 leading-relaxed text-center lg:text-left">
                When enabled, students can create new accounts via the mobile app. 
                Disable this after the registration deadline to prevent unauthorized sign-ups.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status:</span>
                {loading ? (
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${isRegistrationOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <span className={`w-2 h-2 rounded-full ${isRegistrationOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {isRegistrationOpen ? "Accepting Users" : "Registration Closed"}
                  </span>
                )}
              </div>
            </div>

            {/* Right Side: Toggle Switch */}
            <div className="shrink-0">
               {loading ? (
                 <div className="w-14 h-8 bg-gray-200 rounded-full animate-pulse"></div>
               ) : (
                <button
                  onClick={toggleHandler}
                  className={`
                    relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2
                    ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-gray-200'}
                  `}
                >
                  <span className="sr-only">Toggle Registration</span>
                  <span
                    aria-hidden="true"
                    className={`
                      pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${isRegistrationOpen ? 'translate-x-6' : 'translate-x-0'}
                    `}
                  />
                </button>
               )}
            </div>

          </div>
        </div>

        {/* Future Settings Placeholders (Optional visuals to make the page look full) */}
        <div className="p-6 border border-gray-200 border-dashed rounded-2xl flex items-center justify-center text-gray-400 bg-gray-50/50">
          <p className="text-sm font-medium">More system settings coming soon...</p>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;