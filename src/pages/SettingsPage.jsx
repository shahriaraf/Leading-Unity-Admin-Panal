import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const authConfig = {
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await axios.get('https://leading-unity-backend.vercel.app/api/settings');
    setIsRegistrationOpen(data.isStudentRegistrationOpen);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleHandler = async () => {
    await axios.patch('/api/settings/toggle-registration', {}, authConfig);
    fetchSettings();
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Application Settings</h1>
      <div className="max-w-lg p-6 bg-white rounded-lg shadow-md">
        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">Student Registration</h3>
            <p className="mb-4 text-gray-600">Control whether students can register for new accounts via the mobile app.</p>
            <div className="flex items-center space-x-4">
              <p className="text-gray-800">
                Current Status: 
                <span className={`ml-2 font-bold ${isRegistrationOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {isRegistrationOpen ? "OPEN" : "CLOSED"}
                </span>
              </p>
              <button
                onClick={toggleHandler}
                className={`text-white font-bold py-2 px-4 rounded ${isRegistrationOpen ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isRegistrationOpen ? "Close Registration" : "Open Registration"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;