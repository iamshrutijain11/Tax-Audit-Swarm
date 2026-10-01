import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  MoreVertical,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { getDashboardStats, getInvoices, getVendors } from '../api/client';
import type { Invoice, DashboardStats } from '../api/client';

const fmt = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const DONUT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [flagged, setFlagged] = useState<Invoice[]>([]);
  const [vendorCount, setVendorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, inv, vnd, fl] = await Promise.all([
        getDashboardStats(),
        getInvoices({ limit: 10 }),
        getVendors(),
        getInvoices({ status: 'FLAGGED', limit: 3 }),
      ]);
      setStats(s);
      setInvoices(inv.invoices);
      setVendorCount(vnd.vendors.length);
      setFlagged(fl.invoices);
    } catch {
      // handle silently — empty state shown
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build audit volume trend from invoices (last 7 days)
  const trendData = React.useMemo(() => {
    const days: Record<string, { date: string; total: number; pending: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key.slice(5), total: 0, pending: 0 };
    }
    invoices.forEach(inv => {
      const key = inv.created_at?.slice(0, 10);
      if (days[key]) {
        days[key].total++;
        if (inv.status === 'PENDING') days[key].pending++;
      }
    });
    return Object.values(days);
  }, [invoices]);

  const donutData = stats
    ? [
        { name: 'Approved', value: stats.approved },
        { name: 'Flagged', value: stats.flagged },
        { name: 'Manual Review', value: stats.manual_review },
        { name: 'Pending', value: stats.pending },
      ]
    : [];

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_id',
      header: 'Invoice ID',
      render: row => (
        <span className="font-mono text-xs text-violet-300">{row.invoice_id.slice(0, 12)}…</span>
      ),
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      render: row => <span className="text-slate-200">{row.vendor_name || '—'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: row => <span className="font-medium text-white">{fmt(row.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: row => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: row => (
        <button
          className="btn-ghost p-1.5"
          onClick={e => { e.stopPropagation(); navigate(`/invoices/${row.invoice_id}`); }}
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

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
      {/* Hero */}
      <div
        className="glass-card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 50%, rgba(255,255,255,0.02) 100%)',
          borderColor: 'rgba(139,92,246,0.2)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(139,92,246,0.2) 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs text-violet-400/80 font-medium uppercase tracking-widest mb-1">Total Amount Audited</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            {isLoading ? '₹—' : fmt(stats?.total_amount_audited ?? 0)}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Across {stats?.total_invoices ?? 0} invoice audits</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Vendors"
          value={isLoading ? '—' : vendorCount}
          icon={<Users size={18} />}
          accent="violet"
          subtitle="Registered in system"
        />
        <StatCard
          title="Invoices Audited"
          value={isLoading ? '—' : (stats?.total_invoices ?? 0)}
          icon={<FileText size={18} />}
          accent="emerald"
          subtitle="All time"
        />
        <StatCard
          title="Amount Audited"
          value={isLoading ? '₹—' : fmt(stats?.total_amount_audited ?? 0)}
          icon={<DollarSign size={18} />}
          accent="violet"
          subtitle="Total invoice value"
        />
        <StatCard
          title="Needs Review"
          value={isLoading ? '—' : ((stats?.pending ?? 0) + (stats?.manual_review ?? 0))}
          icon={<Clock size={18} />}
          accent="amber"
          subtitle="Pending + Manual Review"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Line chart */}
        <div className="glass-card p-5 xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Audit Volume Trend</h3>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="glass-card p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '11px', color: '#94a3b8' }}>{value}</span>}
                />
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent flags + table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Recent Flags */}
        <div className="glass-card p-5 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">Recent Flags</h3>
          </div>
          <div className="space-y-3">
            {flagged.length === 0 ? (
              <p className="text-slate-600 text-xs">No flagged invoices</p>
            ) : (
              flagged.map(inv => (
                <div
                  key={inv.invoice_id}
                  className="glass-card-hover p-3 cursor-pointer"
                  onClick={() => navigate(`/invoices/${inv.invoice_id}`)}
                >
                  <p className="text-xs font-mono text-red-300 truncate">{inv.invoice_id.slice(0, 16)}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{inv.vendor_name || inv.vendor_gstin}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{fmt(inv.total_amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent invoices table */}
        <div className="glass-card xl:col-span-3">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
            <div className="flex items-center gap-2">
              <button onClick={load} className="btn-ghost p-1.5">
                <RefreshCw size={13} />
              </button>
              <button
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                onClick={() => navigate('/invoices')}
              >
                View all →
              </button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={invoices}
            isLoading={isLoading}
            emptyMessage="No invoices yet — upload one to get started."
            keyExtractor={r => r.invoice_id}
            onRowClick={row => navigate(`/invoices/${row.invoice_id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
