import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  Eye,
  RotateCcw,
  Download,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import type { Column } from '../components/DataTable';
import {
  getInvoices,
  searchInvoices,
  reAuditInvoice,
  overrideInvoice,
  deleteInvoice,
  exportInvoice,
} from '../api/client';
import type { Invoice, Status } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Flagged', value: 'FLAGGED' },
  { label: 'Manual Review', value: 'MANUAL_REVIEW' },
  { label: 'Pending', value: 'PENDING' },
];

const PAGE_SIZE = 20;

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Kebab menu state
  const [menuRow, setMenuRow] = useState<string | null>(null);

  // Override modal
  const [overrideTarget, setOverrideTarget] = useState<Invoice | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<Status>('APPROVED');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasFilters = search || statusTab || dateFrom || dateTo || minAmt || maxAmt;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (hasFilters) {
        const params: Parameters<typeof searchInvoices>[0] = {};
        if (search) params.vendor_name = search;
        if (statusTab) params.status = statusTab;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (minAmt) params.min_amount = Number(minAmt);
        if (maxAmt) params.max_amount = Number(maxAmt);
        const data = await searchInvoices(params);
        setInvoices(data.invoices);
        setTotal(data.total);
      } else {
        const data = await getInvoices({ status: statusTab, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
        setInvoices(data.invoices);
        setTotal(data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, search, dateFrom, dateTo, minAmt, maxAmt, page, hasFilters]);

  useEffect(() => { load(); }, [load]);

  const handleReAudit = async (inv: Invoice) => {
    try {
      const res = await reAuditInvoice(inv.invoice_id);
      addToast(`Re-audit complete: ${res.status}`, 'success');
      load();
    } catch {
      addToast('Re-audit failed.', 'error');
    }
    setMenuRow(null);
  };

  const handleOverride = async () => {
    if (!overrideTarget) return;
    setOverriding(true);
    try {
      await overrideInvoice(overrideTarget.invoice_id, {
        status: overrideStatus,
        reason: overrideReason,
        overridden_by: user?.username,
      });
      addToast('Status overridden successfully.', 'success');
      setOverrideTarget(null);
      setOverrideReason('');
      load();
    } catch {
      addToast('Override failed.', 'error');
    } finally {
      setOverriding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.invoice_id);
      addToast('Invoice deleted.', 'info');
      setDeleteTarget(null);
      load();
    } catch {
      addToast('Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_id',
      header: 'Invoice ID',
      render: row => <span className="font-mono text-xs text-violet-300">{row.invoice_id.slice(0, 12)}…</span>,
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      render: row => <span className="text-slate-200 text-sm">{row.vendor_name || row.vendor_gstin}</span>,
    },
    {
      key: 'base_amount',
      header: 'Base',
      render: row => <span className="text-slate-400 text-xs">{fmt(row.base_amount)}</span>,
    },
    {
      key: 'tax_amount',
      header: 'Tax',
      render: row => <span className="text-slate-400 text-xs">{fmt(row.tax_amount)}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: row => <span className="font-semibold text-white">{fmt(row.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Date',
      render: row => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: row => (
        <div className="relative">
          <button
            className="btn-ghost p-1.5"
            onClick={e => { e.stopPropagation(); setMenuRow(menuRow === row.invoice_id ? null : row.invoice_id); }}
          >
            <MoreVertical size={14} />
          </button>
          {menuRow === row.invoice_id && (
            <div
              className="absolute right-0 top-full mt-1 w-44 glass-card py-1 z-20 animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              {[
                { icon: <Eye size={13} />, label: 'View', onClick: () => { navigate(`/invoices/${row.invoice_id}`); setMenuRow(null); } },
                { icon: <RotateCcw size={13} />, label: 'Re-audit', onClick: () => handleReAudit(row) },
                { icon: <Edit3 size={13} />, label: 'Override', onClick: () => { setOverrideTarget(row); setOverrideStatus(row.status as Status); setMenuRow(null); } },
                { icon: <Download size={13} />, label: 'Export CSV', onClick: () => { exportInvoice(row.invoice_id); setMenuRow(null); } },
                { icon: <Trash2 size={13} />, label: 'Delete', onClick: () => { setDeleteTarget(row); setMenuRow(null); }, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    (item as { danger?: boolean }).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                  onClick={item.onClick}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(f => !f)} className="btn-secondary">
            <Filter size={14} /> Filters
          </button>
          <button onClick={load} className="btn-ghost p-2"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
              statusTab === t.value ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => { setStatusTab(t.value); setPage(0); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & filter row */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by vendor name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="input-field pl-8 h-8 text-xs"
            />
          </div>

          {showFilters && (
            <>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field h-8 text-xs w-36" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field h-8 text-xs w-36" />
              <input type="number" placeholder="Min ₹" value={minAmt} onChange={e => setMinAmt(e.target.value)} className="input-field h-8 text-xs w-28" />
              <input type="number" placeholder="Max ₹" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} className="input-field h-8 text-xs w-28" />
              {hasFilters && (
                <button
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2"
                  onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setMinAmt(''); setMaxAmt(''); }}
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" onClick={() => setMenuRow(null)}>
        <DataTable
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No invoices match your filters."
          keyExtractor={r => r.invoice_id}
          onRowClick={row => navigate(`/invoices/${row.invoice_id}`)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button className="btn-ghost p-1.5" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-slate-400 px-2">{page + 1} / {totalPages}</span>
              <button className="btn-ghost p-1.5" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Override Modal */}
      <Modal
        isOpen={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        title="Override Invoice Status"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOverrideTarget(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleOverride} disabled={overriding || !overrideReason}>
              {overriding ? 'Saving…' : 'Override'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">New Status</label>
            <select
              className="input-field"
              value={overrideStatus}
              onChange={e => setOverrideStatus(e.target.value as Status)}
            >
              {(['APPROVED', 'FLAGGED', 'MANUAL_REVIEW', 'PENDING'] as Status[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Reason *</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Explain the reason for override..."
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">Overriding as: <span className="text-violet-300">{user?.username}</span></p>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Invoice"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to delete invoice{' '}
          <span className="font-mono text-violet-300">{deleteTarget?.invoice_id.slice(0, 12)}</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Invoices;
