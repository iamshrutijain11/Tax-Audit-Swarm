import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  CreditCard,
  BarChart2,
  Bell,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Vendors', icon: Users, to: '/vendors' },
  { label: 'Invoices', icon: FileText, to: '/invoices' },
  { label: 'Upload & Audit', icon: Upload, to: '/audit' },
  { label: 'Bank Transactions', icon: CreditCard, to: '/bank-transactions' },
  { label: 'Reports', icon: BarChart2, to: '/reports' },
  { label: 'Live Audit Log', icon: Bell, to: '/audit-log' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a12 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            boxShadow: '0 0 20px rgba(139,92,246,0.5)',
          }}
        >
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-sm font-bold text-white tracking-tight">ATAS</div>
            <div className="text-[10px] text-slate-500 font-medium">Tax Audit Swarm</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`ml-auto btn-ghost p-1 ${collapsed ? 'mx-auto' : ''}`}
        >
          <ChevronRight
            size={14}
            className={`text-slate-500 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* CTA card */}
      {!collapsed && (
        <div
          className="m-3 p-4 rounded-2xl cursor-pointer animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
          onClick={() => navigate('/audit')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Automate. Simplify.</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">Stay compliant with AI-powered GST invoice auditing.</p>
          <button className="mt-3 text-[11px] bg-violet-600/40 hover:bg-violet-600/60 text-violet-200 px-3 py-1.5 rounded-lg transition-all duration-200 border border-violet-500/20 w-full">
            Start Audit →
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
