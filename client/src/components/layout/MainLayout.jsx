import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {/* Outlet renders the matched child route */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
