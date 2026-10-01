import React, { useEffect, useState, useCallback } from 'react';
import { Download, BarChart2, Users, FileText, Clock, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import StatCard from '../components/StatCard';
import { getDashboardStats, getVendors, exportAllInvoices } from '../api/client';
import type { DashboardStats, Vendor } from '../api/client';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, v] = await Promise.all([getDashboardStats(), getVendors()]);
      setStats(s);
      setVendors(v.vendors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const donutData = stats
    ? [
        { name: 'Approved', value: stats.approved },
        { name: 'Flagged', value: stats.flagged },
        { name: 'Manual Review', value: stats.manual_review },
        { name: 'Pending', value: stats.pending },
      ]
    : [];

  const riskData = vendors
    .slice(0, 10)
    .map(v => ({ name: v.vendor_name.slice(0, 14), risk: v.risk_score }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="text-slate-400 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit analytics and CSV exports</p>
        </div>
        <button className="btn-primary" onClick={exportAllInvoices}>
          <Download size={16} /> Export All Invoices CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Invoices" value={isLoading ? '—' : (stats?.total_invoices ?? 0)} icon={<FileText size={18} />} accent="violet" />
        <StatCard title="Total Vendors" value={isLoading ? '—' : vendors.length} icon={<Users size={18} />} accent="emerald" />
        <StatCard title="Amount Audited" value={isLoading ? '₹—' : fmt(stats?.total_amount_audited ?? 0)} icon={<TrendingUp size={18} />} accent="violet" />
        <StatCard title="Pending Review" value={isLoading ? '—' : ((stats?.pending ?? 0) + (stats?.manual_review ?? 0))} icon={<Clock size={18} />} accent="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Status donut */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Audit Status Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {donutData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: '11px', color: '#94a3b8' }}>{v}</span>}
              />
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-slate-400">{d.name}:</span>
                <span className="text-white font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor risk bar */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Top Vendor Risk Scores</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="risk" name="Risk Score" radius={[0, 4, 4, 0]}>
                {riskData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.risk <= 30 ? '#10b981' : entry.risk <= 70 ? '#f59e0b' : '#ef4444'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Audit Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Approval Rate', value: stats ? `${((stats.approved / (stats.total_invoices || 1)) * 100).toFixed(1)}%` : '—', color: '#10b981' },
            { label: 'Flag Rate', value: stats ? `${((stats.flagged / (stats.total_invoices || 1)) * 100).toFixed(1)}%` : '—', color: '#ef4444' },
            { label: 'Review Rate', value: stats ? `${((stats.manual_review / (stats.total_invoices || 1)) * 100).toFixed(1)}%` : '—', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
