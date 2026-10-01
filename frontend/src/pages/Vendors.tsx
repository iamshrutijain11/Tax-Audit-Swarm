import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ExternalLink, Loader2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import type { Column } from '../components/DataTable';
import { getVendors, createVendor } from '../api/client';
import type { Vendor } from '../api/client';

const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
  const level = score <= 30 ? 'Low' : score <= 70 ? 'Medium' : 'High';
  const cls =
    score <= 30
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : score <= 70
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level} ({score})
    </span>
  );
};

const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filtered, setFiltered] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ vendor_gstin: '', vendor_name: '', state_code: '', risk_score: 50 });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVendors();
      setVendors(data.vendors);
      setFiltered(data.vendors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      vendors.filter(
        v =>
          v.vendor_name.toLowerCase().includes(q) ||
          v.vendor_gstin.toLowerCase().includes(q) ||
          v.state_code.toLowerCase().includes(q)
      )
    );
  }, [search, vendors]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (form.vendor_gstin.length !== 15) {
      setAddError('GSTIN must be exactly 15 characters.');
      return;
    }
    setIsAdding(true);
    try {
      await createVendor({ ...form, risk_score: Number(form.risk_score) });
      setShowAdd(false);
      setForm({ vendor_gstin: '', vendor_name: '', state_code: '', risk_score: 50 });
      await load();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setAddError(axErr?.response?.data?.detail ?? 'Failed to add vendor.');
    } finally {
      setIsAdding(false);
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'vendor_name',
      header: 'Vendor Name',
      render: row => <span className="font-medium text-slate-200">{row.vendor_name}</span>,
    },
    {
      key: 'vendor_gstin',
      header: 'GSTIN',
      render: row => <span className="font-mono text-xs text-slate-400">{row.vendor_gstin}</span>,
    },
    {
      key: 'state_code',
      header: 'State',
      render: row => (
        <span className="bg-white/[0.05] text-slate-300 text-xs px-2 py-0.5 rounded-lg border border-white/[0.08]">
          {row.state_code}
        </span>
      ),
    },
    {
      key: 'risk_score',
      header: 'Risk Score',
      render: row => <RiskBadge score={row.risk_score} />,
    },
    {
      key: 'created_at',
      header: 'Added',
      render: row => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: row => (
        <button
          className="btn-ghost p-1.5"
          onClick={e => { e.stopPropagation(); navigate(`/vendors/${row.vendor_gstin}`); }}
        >
          <ExternalLink size={13} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vendors</h1>
          <p className="text-sm text-slate-500 mt-0.5">{vendors.length} registered vendors, sorted by risk</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      <div className="glass-card">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No vendors found."
          keyExtractor={r => r.vendor_gstin}
          onRowClick={row => navigate(`/vendors/${row.vendor_gstin}`)}
        />
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setAddError(''); }}
        title="Add New Vendor"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button form="add-vendor-form" type="submit" className="btn-primary" disabled={isAdding}>
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Vendor
            </button>
          </>
        }
      >
        <form id="add-vendor-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">GSTIN (15 chars) *</label>
            <input
              type="text"
              placeholder="27AABCU9603R1ZX"
              value={form.vendor_gstin}
              maxLength={15}
              onChange={e => setForm(f => ({ ...f, vendor_gstin: e.target.value.toUpperCase() }))}
              className="input-field font-mono"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Vendor Name *</label>
            <input
              type="text"
              placeholder="Acme Supplies Pvt Ltd"
              value={form.vendor_name}
              onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">State Code *</label>
              <input
                type="text"
                placeholder="27"
                value={form.state_code}
                maxLength={2}
                onChange={e => setForm(f => ({ ...f, state_code: e.target.value }))}
                className="input-field font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Risk Score ({form.risk_score})
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.risk_score}
                onChange={e => setForm(f => ({ ...f, risk_score: +e.target.value }))}
                className="w-full accent-violet-500 mt-1"
              />
            </div>
          </div>
          {addError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {addError}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Vendors;
