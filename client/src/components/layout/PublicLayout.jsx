import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer can be added here later */}
    </div>
  );
};

export default PublicLayout;
