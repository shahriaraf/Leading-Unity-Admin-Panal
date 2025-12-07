import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 text-white bg-gray-800">
        <div className="p-5 text-2xl font-bold">Admin Panel</div>
        <nav className="flex-grow">
          <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
            Users
          </Link>
          <Link to="/courses" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
            Courses
          </Link>
          <Link to="/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
            Settings
          </Link>
          <Link to="/submissions" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
            All Submissions
          </Link>
        </nav>
        <div className="p-4">
          <button
            onClick={logoutHandler}
            className="w-full px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;