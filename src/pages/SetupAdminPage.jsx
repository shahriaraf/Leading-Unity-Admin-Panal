import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SetupAdminPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // Call the secret backend route to create the admin
      const { data } = await axios.post('http://localhost:5000/api/auth/register/admin-secret', {
        name,
        email,
        password,
      });

      // If successful, automatically log the user in by saving their info
      localStorage.setItem('userInfo', JSON.stringify(data));

      // Redirect to the main admin dashboard
      navigate('/');
      
    } catch (err) {
      // Display any error from the backend (e.g., "Admin already exists")
      setError(err.response?.data?.message || 'An error occurred during setup');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={submitHandler} className="w-full max-w-sm p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">Create Admin Account</h2>
        <p className="mb-6 text-sm text-center text-gray-500">(One-time setup)</p>

        {error && <p className="p-2 mb-4 text-sm text-red-500 bg-red-100 rounded">{error}</p>}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="name">
            Admin Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="email">
            Admin Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button type="submit" className="w-full p-2 text-white transition-colors bg-green-500 rounded hover:bg-green-600">
          Create Admin & Login
        </button>
      </form>
    </div>
  );
};

export default SetupAdminPage;