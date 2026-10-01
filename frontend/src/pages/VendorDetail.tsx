import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, FileText, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { getVendor, updateVendor, getVendorInvoices } from '../api/client';
import type { Vendor, Invoice } from '../api/client';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const VendorDetail: React.FC = () => {
  const { gstin } = useParams<{ gstin: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'invoices'>('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ vendor_name: '', state_code: '', risk_score: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!gstin) return;
    Promise.all([getVendor(gstin), getVendorInvoices(gstin)])
      .then(([v, inv]) => {
        setVendor(v);
        setEditForm({ vendor_name: v.vendor_name, state_code: v.state_code, risk_score: v.risk_score });
        setInvoices(inv.invoices);
      })
      .finally(() => setIsLoading(false));
  }, [gstin]);

  const handleSave = async () => {
    if (!gstin) return;
    setSaving(true);
    try {
      const updated = await updateVendor(gstin, editForm);
      setVendor(v => v ? { ...v, ...updated } : v);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const invoiceColumns: Column<Invoice>[] = [
    { key: 'invoice_id', header: 'Invoice ID', render: r => <span className="font-mono text-xs text-violet-300">{r.invoice_id.slice(0, 12)}…</span> },
    { key: 'total_amount', header: 'Amount', render: r => <span className="font-medium text-white">{fmt(r.total_amount)}</span> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} size="sm" /> },
    {
      key: 'created_at', header: 'Date',
      render: r => <span className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400">Vendor not found.</p>
        <button className="btn-secondary mt-4 mx-auto" onClick={() => navigate('/vendors')}>
          Back to Vendors
        </button>
      </div>
    );
  }

  const riskColor = vendor.risk_score <= 30 ? '#10b981' : vendor.risk_score <= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => navigate('/vendors')}><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">{vendor.vendor_name}</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{vendor.vendor_gstin}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Invoices', value: vendor.total_invoices ?? invoices.length, icon: <FileText size={16} /> },
          { label: 'Flagged', value: vendor.flagged_invoices ?? invoices.filter(i => i.status === 'FLAGGED').length, icon: <AlertTriangle size={16} /> },
          { label: 'Risk Score', value: vendor.risk_score, icon: null },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0">
        {(['overview', 'invoices'] as const).map(t => (
          <button
            key={t}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all duration-200 ${
              tab === t ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Vendor Details</h2>
            {!editing ? (
              <button className="btn-ghost flex items-center gap-1.5 text-xs px-3" onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="btn-ghost p-1.5" onClick={() => setEditing(false)}><X size={14} /></button>
                <button className="btn-primary py-1.5 px-3 text-xs" onClick={handleSave} disabled={saving}>
                  {saving ? '…' : <><Check size={13} /> Save</>}
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Vendor Name</label>
              {editing ? (
                <input className="input-field text-sm" value={editForm.vendor_name}
                  onChange={e => setEditForm(f => ({ ...f, vendor_name: e.target.value }))} />
              ) : (
                <p className="text-sm text-white">{vendor.vendor_name}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">GSTIN</label>
              <p className="text-sm font-mono text-slate-400">{vendor.vendor_gstin}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">State Code</label>
              {editing ? (
                <input className="input-field text-sm font-mono" value={editForm.state_code} maxLength={2}
                  onChange={e => setEditForm(f => ({ ...f, state_code: e.target.value }))} />
              ) : (
                <p className="text-sm text-white">{vendor.state_code}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Risk Score {editing ? `(${editForm.risk_score})` : ''}</label>
              {editing ? (
                <input type="range" min={0} max={100} className="w-full accent-violet-500"
                  value={editForm.risk_score}
                  onChange={e => setEditForm(f => ({ ...f, risk_score: +e.target.value }))} />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${vendor.risk_score}%`, background: riskColor }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: riskColor }}>{vendor.risk_score}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="glass-card">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Invoices for {vendor.vendor_name}</h2>
          </div>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            isLoading={false}
            emptyMessage="No invoices for this vendor."
            keyExtractor={r => r.invoice_id}
          />
        </div>
      )}
    </div>
  );
};

export default VendorDetail;
