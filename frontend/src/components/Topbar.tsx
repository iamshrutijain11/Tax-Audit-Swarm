import React, { useState, useEffect } from 'react';
import { Search, LogOut, User, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHealth } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  sidebarWidth: number;
  onSearch?: (q: string) => void;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Topbar: React.FC<TopbarProps> = ({ sidebarWidth, onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const check = () =>
      getHealth()
        .then(h => setDbConnected(h.db_connected))
        .catch(() => setDbConnected(false));

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6 py-3"
      style={{
        left: sidebarWidth,
        background: 'rgba(10,10,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'left 0.3s',
      }}
    >
      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">
          {getGreeting()},{' '}
          <span className="text-violet-400">{user?.username || 'Auditor'}</span> 👋
        </div>
        <div className="text-[11px] text-slate-500">GST Invoice Audit Dashboard</div>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search size={14} className="absolute left-3 text-slate-500" />
        <input
          id="topbar-search"
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={handleSearch}
          className="input-field pl-8 w-56 h-8 text-xs"
        />
      </div>

      {/* Health dot */}
      <div className="flex items-center gap-1.5">
        <Circle
          size={8}
          className={
            dbConnected === null
              ? 'text-slate-500 fill-slate-500'
              : dbConnected
              ? 'text-emerald-400 fill-emerald-400'
              : 'text-red-400 fill-red-400'
          }
          style={
            dbConnected === true
              ? { filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.8))' }
              : dbConnected === false
              ? { filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.8))' }
              : {}
          }
        />
        <span className="text-[10px] text-slate-500 hidden sm:block">
          {dbConnected === null ? 'Checking...' : dbConnected ? 'DB Online' : 'DB Offline'}
        </span>
      </div>

      {/* Avatar / profile menu */}
      <div className="relative">
        <button
          id="profile-menu-btn"
          onClick={() => setShowMenu(m => !m)}
          className="flex items-center gap-2 hover:bg-white/[0.06] px-2 py-1.5 rounded-xl transition-all duration-200"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="text-xs text-slate-300 hidden sm:block">{user?.username || 'Auditor'}</span>
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-full mt-2 w-48 glass-card py-1 animate-fade-in z-50"
          >
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
              onClick={() => { navigate('/settings'); setShowMenu(false); }}
            >
              <User size={14} />
              Account Settings
            </button>
            <div className="border-t border-white/[0.06] my-1" />
            <button
              id="logout-btn"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
