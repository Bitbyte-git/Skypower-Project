import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #F8FBFF 0%, #EEF5FD 55%, #E7F1FC 100%)' }}
    >
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar with responsive mobile drawer support */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
