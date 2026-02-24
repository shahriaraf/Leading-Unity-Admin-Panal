import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

// --- ICONS (Matched to Image Style) ---
const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CourseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const FileIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  // Nav Item Component with Curve Logic
  const NavItem = ({ to, label, icon: Icon }) => {
    const isActive = location.pathname === to;
    
    // Background Colors
    const sidebarBg = '#0d2331'; // Deep Teal
    const contentBg = '#eef5f9'; // Pale Blue/White

    return (
      <li className="relative mb-1">
        {/* --- THE CURVE HACK --- */}
        {isActive && (
          <>
            {/* Top Curve */}
            <div 
              className="absolute right-0 -top-5 w-5 h-5 z-20"
              style={{
                background: sidebarBg, 
                mask: `radial-gradient(circle at 0 0, transparent 20px, black 20px)`,
                WebkitMask: `radial-gradient(circle at 0 0, transparent 20px, black 20px)`
              }}
            >
              <div className="w-full h-full" style={{ background: contentBg }}></div>
            </div>

            {/* Bottom Curve */}
            <div 
              className="absolute right-0 -bottom-5 w-5 h-5 z-20"
              style={{
                background: sidebarBg,
                mask: `radial-gradient(circle at 0 100%, transparent 20px, black 20px)`,
                WebkitMask: `radial-gradient(circle at 0 100%, transparent 20px, black 20px)`
              }}
            >
              <div className="w-full h-full" style={{ background: contentBg }}></div>
            </div>
          </>
        )}

        <Link
          to={to}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`
            relative flex items-center gap-4 px-6 py-3.5 text-sm font-semibold transition-all duration-200
            ${isActive 
              ? `bg-[#eef5f9] text-[#0d2331] rounded-l-[30px] ml-4` // Active
              : 'text-[#8daab9] hover:text-white ml-4' // Inactive
            }
          `}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-[#eef5f9] overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-30 bg-[#0d2331] text-white flex items-center justify-between px-4 h-16 shadow-md">
        <span className="text-lg font-bold">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-[#0d2331] flex flex-col transition-transform duration-300 ease-in-out
          md:translate-x-0 md:relative md:flex
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-10 pb-8 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 border-2 border-white/20 mb-3 overflow-hidden">
             <img src="https://ui-avatars.com/api/?name=Admin&background=random&color=fff" alt="Admin" className="w-full h-full object-cover"/>
          </div>
          <h2 className="text-white font-bold text-lg tracking-wide">Admin Panel</h2>
          <p className="text-[#8daab9] text-xs">luadmin@gmail.com</p>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-0 overflow-y-auto">
          <ul className="space-y-1">
            <NavItem to="/" label="Users" icon={UsersIcon} />
            <NavItem to="/courses" label="Courses" icon={CourseIcon} />
            <NavItem to="/submissions" label="Submissions" icon={FileIcon} />
            <NavItem to="/settings" label="Settings" icon={SettingsIcon} />
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="p-6">
          <button 
            onClick={logoutHandler}
            className="flex items-center gap-3 text-[#8daab9] hover:text-red-400 transition-colors text-sm font-medium w-full px-4"
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
        {/* Spacer for mobile header */}
        <div className="md:hidden h-16 shrink-0 bg-[#eef5f9]"></div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Layout;