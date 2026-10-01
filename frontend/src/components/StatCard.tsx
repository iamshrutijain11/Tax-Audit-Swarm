import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number; // percent change, positive = up
  accent?: 'violet' | 'emerald' | 'red' | 'amber';
  className?: string;
}

const accentMap = {
  violet: {
    icon: 'bg-violet-500/15 text-violet-400',
    glow: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.18)',
  },
  emerald: {
    icon: 'bg-emerald-500/15 text-emerald-400',
    glow: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.18)',
  },
  red: {
    icon: 'bg-red-500/15 text-red-400',
    glow: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.18)',
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-400',
    glow: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.18)',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'violet',
  className = '',
}) => {
  const a = accentMap[accent];

  return (
    <div
      className={`glass-card p-5 relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(ellipse at top right, ${a.glow} 0%, rgba(255,255,255,0.02) 60%)`,
        borderColor: a.border,
      }}
    >
      {/* Background glow decoration */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ backgroundColor: a.border }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                trend >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend).toFixed(1)}% vs last period
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
