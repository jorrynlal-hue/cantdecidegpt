'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Code,
  ImageIcon,
  FileText,
  Languages,
  PenTool,
  BarChart3,
  Mic,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
  ScrollText,
  Activity,
  ListChecks,
  Calendar,
  Users,
  Megaphone,
  Mail,
  Wallet,
  Workflow,
  Plug,
  Bell,
  Boxes,
  CreditCard,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  prefix?: string;
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'AI Tools',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
      { label: 'Code Generator', href: '/dashboard/code', icon: Code },
      { label: 'Image Generator', href: '/dashboard/image', icon: ImageIcon },
      { label: 'Summarizer', href: '/dashboard/summarize', icon: FileText },
      { label: 'Translator', href: '/dashboard/translate', icon: Languages },
      { label: 'Writing Assistant', href: '/dashboard/writing', icon: PenTool },
      { label: 'Data Analysis', href: '/dashboard/analyze', icon: BarChart3 },
      { label: 'Voice-to-Text', href: '/dashboard/voice', icon: Mic },
    ],
  },
  {
    label: 'Operations Control Plane',
    items: [
      { label: 'Work Queue', href: '/dashboard/operations', icon: ClipboardList, prefix: '/dashboard/operations' },
      { label: 'Approval Center', href: '/dashboard/operations/approvals', icon: CheckSquare, prefix: '/dashboard/operations/approvals' },
      { label: 'Policy Center', href: '/dashboard/operations/policies', icon: ShieldCheck, prefix: '/dashboard/operations/policies' },
      { label: 'Audit Ledger', href: '/dashboard/operations/audit', icon: ScrollText, prefix: '/dashboard/operations/audit' },
      { label: 'Measure & Learn', href: '/dashboard/operations/metrics', icon: Activity, prefix: '/dashboard/operations/metrics' },
    ],
  },
  {
    label: 'Human + AI',
    items: [
      { label: 'Human Workspace', href: '/dashboard/humans', icon: HeartHandshake, prefix: '/dashboard/humans' },
      { label: 'Plans & Billing', href: '/dashboard/plans', icon: CreditCard, prefix: '/dashboard/plans' },
    ],
  },
  {
    label: 'Work Platform',
    items: [
      { label: 'Overview', href: '/dashboard/platform', icon: LayoutDashboard, prefix: '/dashboard/platform' },
      { label: 'Tasks & Projects', href: '/dashboard/work', icon: ListChecks, prefix: '/dashboard/work' },
      { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar, prefix: '/dashboard/calendar' },
      { label: 'CRM & Sales', href: '/dashboard/crm', icon: Users, prefix: '/dashboard/crm' },
      { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, prefix: '/dashboard/marketing' },
      { label: 'Email', href: '/dashboard/email', icon: Mail, prefix: '/dashboard/email' },
      { label: 'AI Studio', href: '/dashboard/ai', icon: Sparkles, prefix: '/dashboard/ai' },
      { label: 'Documents', href: '/dashboard/docs', icon: FileText, prefix: '/dashboard/docs' },
      { label: 'Finance', href: '/dashboard/finance', icon: Wallet, prefix: '/dashboard/finance' },
      { label: 'Automation', href: '/dashboard/automation', icon: Workflow, prefix: '/dashboard/automation' },
      { label: 'Approvals', href: '/dashboard/approvals', icon: CheckSquare, prefix: '/dashboard/approvals' },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, prefix: '/dashboard/analytics' },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, prefix: '/dashboard/integrations' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, prefix: '/dashboard/notifications' },
      { label: 'Team', href: '/dashboard/team', icon: Users, prefix: '/dashboard/team' },
      { label: 'Workspaces', href: '/dashboard/workspaces', icon: Boxes, prefix: '/dashboard/workspaces' },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, prefix: '/dashboard/settings' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0d0d12] border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
        <Sparkles className="w-6 h-6 text-purple-400 shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-bold text-white whitespace-nowrap overflow-hidden"
            >
              Can't Decide GPT
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.prefix
                  ? pathname === item.href || pathname.startsWith(item.prefix)
                  : pathname === item.href;
                const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-purple-500/10 border border-purple-500/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0 relative z-10" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle (desktop only) */}
      <div className="hidden lg:flex border-t border-white/5 p-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:block fixed inset-y-0 left-0 z-40 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
