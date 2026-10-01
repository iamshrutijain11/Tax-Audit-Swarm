import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getInvoice, getAuditTrail, getInvoiceFileUrl, exportInvoice, reAuditInvoice } from '../api/client';
import type { Invoice, AuditTrailItem } from '../api/client';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const agentColors: Record<string, string> = {
  Agent1_Vision: '#3b82f6',
  Agent2_Ledger: '#8b5cf6',
  Agent3_Tax: '#10b981',
  Pipeline: '#f59e0b',
  human_override: '#f43f5e',
};

const InvoiceDetail: React.FC = () => {
  const params = useParams<{ id?: string; '*': string }>();
  const id = params['*'] ? `${params.id}/${params['*']}` : params.id;
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [trail, setTrail] = useState<AuditTrailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reauditing, setReauditing] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([getInvoice(id), getAuditTrail(id)])
      .then(([inv, t]) => {
        setInvoice(inv);
        setTrail(t.trail);
        setFileUrl(getInvoiceFileUrl(id));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleReAudit = async () => {
    if (!id) return;
    setReauditing(true);
    try {
      const res = await reAuditInvoice(id);
      addToast(`Re-audit complete: ${res.status} — ${res.reason}`, 'success');
      const updated = await getInvoice(id);
      setInvoice(updated);
    } catch {
      addToast('Re-audit failed.', 'error');
    } finally {
      setReauditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400">Invoice not found.</p>
        <button className="btn-secondary mt-4 mx-auto" onClick={() => navigate('/invoices')}>Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => navigate('/invoices')}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white font-mono">{invoice.invoice_id.slice(0, 18)}…</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{invoice.vendor_name || invoice.vendor_gstin}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleReAudit} disabled={reauditing}>
            <RotateCcw size={14} className={reauditing ? 'animate-spin' : ''} />
            {reauditing ? 'Re-auditing…' : 'Re-audit'}
          </button>
          <button className="btn-secondary" onClick={() => id && exportInvoice(id)}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Details + file */}
        <div className="xl:col-span-2 space-y-4">
          {/* Financial details */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Vendor', value: invoice.vendor_name || '—' },
                { label: 'GSTIN', value: invoice.vendor_gstin, mono: true },
                { label: 'State Code', value: invoice.state_code || '—' },
                { label: 'Base Amount', value: fmt(invoice.base_amount) },
                { label: 'Tax Amount', value: fmt(invoice.tax_amount) },
                { label: 'Total Amount', value: fmt(invoice.total_amount), highlight: true },
                { label: 'Risk Score', value: invoice.risk_score ?? '—' },
                { label: 'Created', value: new Date(invoice.created_at).toLocaleString('en-IN') },
                { label: 'Overridden By', value: invoice.overridden_by || '—' },
              ].map(field => (
                <div key={field.label}>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{field.label}</p>
                  <p className={`text-sm ${field.highlight ? 'text-xl font-bold text-white' : field.mono ? 'font-mono text-slate-300 text-xs' : 'text-slate-200'}`}>
                    {String(field.value)}
                  </p>
                </div>
              ))}
            </div>
            {invoice.reason && (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 mb-1">Audit Reason</p>
                <p className="text-sm text-slate-300">{invoice.reason}</p>
              </div>
            )}
          </div>

          {/* File preview */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Invoice File</h2>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex items-center gap-1 text-xs px-2"
              >
                <ExternalLink size={12} /> Open
              </a>
            </div>
            {fileError ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm border border-dashed border-white/[0.08] rounded-xl">
                File preview unavailable
              </div>
            ) : (
              <img
                src={fileUrl}
                alt="Invoice file"
                className="w-full max-h-64 object-contain rounded-xl border border-white/[0.06]"
                onError={() => setFileError(true)}
              />
            )}
          </div>
        </div>

        {/* Right: Audit trail */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Audit Trail</h2>
          {trail.length === 0 ? (
            <p className="text-slate-600 text-sm">No audit trail yet.</p>
          ) : (
            <div className="space-y-0">
              {trail.map((item, i) => {
                const color = agentColors[item.agent_name] ?? '#64748b';
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                      />
                      {i < trail.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: `${color}30` }} />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-semibold" style={{ color }}>{item.agent_name}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{item.action_taken}</p>
                      {item.reason && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.reason}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">
                        {new Date(item.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
