// AdminRegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AdminRegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [successmassage, setSuccessmessage] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const { data } = await axios.post(
        'https://leading-unity-nest-backend.vercel.app/api/auth/register/admin-secret',
        { name, email, password }
      );
      setSuccessmessage(`Admin registered successfully! Email: ${data.email}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submitHandler}
        className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Temporary Admin Register
        </h2>
        {message && <p className="text-center text-red-500 mb-4">{message}</p> || successmassage && <p className="text-center text-green-500 mb-4">{successmassage}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        >
          Register Admin
        </button>
      </form>
    </div>
  );
};

export default AdminRegisterPage;
