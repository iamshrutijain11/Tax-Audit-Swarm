import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import type { Column } from '../components/DataTable';
import { getBankTransactions, createBankTransaction } from '../api/client';
import type { BankTransaction } from '../api/client';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const BankTransactions: React.FC = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ vendor_gstin: '', amount_paid: '', payment_date: '' });
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBankTransactions();
      setTransactions(data.transactions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);
    try {
      await createBankTransaction({
        vendor_gstin: form.vendor_gstin,
        amount_paid: Number(form.amount_paid),
        payment_date: form.payment_date || undefined,
      });
      addToast('Transaction added successfully.', 'success');
      setShowAdd(false);
      setForm({ vendor_gstin: '', amount_paid: '', payment_date: '' });
      await load();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setAddError(axErr?.response?.data?.detail ?? 'Failed to add transaction.');
    } finally {
      setIsAdding(false);
    }
  };

  const columns: Column<BankTransaction>[] = [
    {
      key: 'transaction_id',
      header: '#',
      render: row => <span className="text-slate-500 text-xs font-mono">{row.transaction_id}</span>,
    },
    {
      key: 'vendor_gstin',
      header: 'Vendor GSTIN',
      render: row => <span className="font-mono text-xs text-slate-300">{row.vendor_gstin}</span>,
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid',
      render: row => <span className="font-semibold text-white">{fmt(row.amount_paid)}</span>,
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      render: row => (
        <span className="text-slate-400 text-xs">
          {row.payment_date ? new Date(row.payment_date).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Recorded',
      render: row => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      ),
    },
  ];

  const total = transactions.reduce((sum, t) => sum + t.amount_paid, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bank Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{transactions.length} records · Total: {fmt(total)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={transactions}
          isLoading={isLoading}
          emptyMessage="No transactions recorded yet."
          keyExtractor={r => r.transaction_id}
        />
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setAddError(''); }}
        title="Add Bank Transaction"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button form="add-txn-form" type="submit" className="btn-primary" disabled={isAdding}>
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </>
        }
      >
        <form id="add-txn-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Vendor GSTIN *</label>
            <input
              className="input-field font-mono"
              placeholder="27AABCU9603R1ZX"
              value={form.vendor_gstin}
              maxLength={15}
              onChange={e => setForm(f => ({ ...f, vendor_gstin: e.target.value.toUpperCase() }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Amount Paid (₹) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-field"
              placeholder="50000"
              value={form.amount_paid}
              onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Payment Date (optional)</label>
            <input
              type="date"
              className="input-field"
              value={form.payment_date}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
            />
          </div>
          {addError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{addError}</p>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default BankTransactions;
