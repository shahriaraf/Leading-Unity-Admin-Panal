import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

// --- Icons ---
const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CourseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const FileIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LogoIcon = () => <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
// New Icons for Mobile Menu
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Helper component for Nav Links
  const NavItem = ({ to, label, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={closeMobileMenu} // Auto-close menu on click (mobile)
        className={`flex items-center px-4 py-3 mb-1 text-sm font-medium transition-all duration-200 rounded-lg group ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'}`}>
          <Icon />
        </span>
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- Mobile Header (Visible only on small screens) --- */}
      <div className="md:hidden fixed top-0 w-full z-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-16 shadow-md">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-lg font-bold text-white">AdminPortal</span>
        </div>
        <button 
          onClick={toggleMobileMenu} 
          className="text-gray-400 hover:text-white transition-colors focus:outline-none"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* --- Overlay (Mobile Only) --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* --- Sidebar --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
          md:translate-x-0 md:relative md:flex
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        
        {/* Brand / Logo (Desktop) */}
        <div className="hidden md:flex items-center gap-3 px-6 h-20 border-b border-slate-800">
          <LogoIcon />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">AdminPortal</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Leading Unity</p>
          </div>
        </div>

        {/* Brand / Logo (Mobile Placeholder inside menu) */}
        <div className="md:hidden flex items-center gap-3 px-6 h-16 border-b border-slate-800">
           <span className="text-sm text-gray-400">Navigation Menu</span>
        </div>

        {/* Navigation */}
        <div className="flex-grow px-4 py-6 overflow-y-auto">
          <div className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Menu
          </div>
          <nav className="space-y-1">
            <NavItem to="/" label="Users" icon={UsersIcon} />
            <NavItem to="/courses" label="Courses" icon={CourseIcon} />
            <NavItem to="/submissions" label="Submissions" icon={FileIcon} />
          </nav>

          <div className="mt-8 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System
          </div>
          <nav className="space-y-1">
            <NavItem to="/settings" label="Settings" icon={SettingsIcon} />
          </nav>
        </div>

        {/* User / Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
            </div>
            <button
              onClick={logoutHandler}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
        
        {/* Spacer for Mobile Header */}
        <div className="md:hidden h-16 shrink-0"></div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Layout;