'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from '../platform/Header';
import StatusBar from './StatusBar';
import AttentionAlerts from '../platform/AttentionAlerts';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen flex flex-col"
      >
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-30 p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Header />

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <StatusBar />
      </motion.div>

      <AttentionAlerts />
    </div>
  );
}