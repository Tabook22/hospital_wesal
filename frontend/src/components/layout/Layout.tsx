import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 relative">
      <Navbar onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
      <div className="flex-1 flex">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

