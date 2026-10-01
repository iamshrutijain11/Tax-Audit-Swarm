import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Zap, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import PipelineStepper from '../components/PipelineStepper';
import StatusBadge from '../components/StatusBadge';
import { auditInvoice, getWsUrl } from '../api/client';
import type { AuditResponse, AuditLogEvent } from '../api/client';

const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

const Audit: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [wsEvents, setWsEvents] = useState<AuditLogEvent[]>([]);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const connectWs = useCallback(() => {
    const url = getWsUrl('/ws/audit-logs');
    const ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try {
        const event: AuditLogEvent = JSON.parse(e.data);
        setWsEvents(prev => [...prev, event]);
      } catch {
        // ignore non-JSON frames
      }
    };
    ws.onerror = () => {};
    wsRef.current = ws;
  }, []);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) { setError('Please upload an image or PDF file.'); return; }
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setWsEvents([]);
    setResult(null);
    setError('');

    // Open WebSocket before the HTTP request
    connectWs();

    try {
      const res = await auditInvoice(file);
      setResult(res);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setError(axErr?.response?.data?.detail ?? 'Audit failed — check backend connection.');
    } finally {
      setIsUploading(false);
      // Close WS after a brief delay to let final events arrive
      setTimeout(() => wsRef.current?.close(), 2000);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setWsEvents([]);
    setError('');
    wsRef.current?.close();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Upload & Audit</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload a GST purchase invoice — 3 AI agents will audit it in real time.</p>
      </div>

      {/* Upload zone */}
      {!result && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
            dragging
              ? 'border-violet-400 bg-violet-500/10'
              : file
              ? 'border-violet-500/40 bg-violet-500/5'
              : 'border-white/[0.10] hover:border-violet-500/30 hover:bg-white/[0.02]'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
          style={dragging ? { boxShadow: '0 0 30px rgba(139,92,246,0.2)' } : {}}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />

          {!file ? (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                <Upload size={24} className="text-violet-400" />
              </div>
              <p className="text-white font-medium mb-1">Drop invoice here or click to browse</p>
              <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, PDF — up to 10 MB</p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <FileText size={18} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                className="btn-ghost p-1.5"
                onClick={e => { e.stopPropagation(); reset(); }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      {file && !result && (
        <button
          className="btn-primary w-full justify-center py-3 text-base"
          onClick={handleSubmit}
          disabled={isUploading}
          style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
        >
          <Zap size={18} className={isUploading ? 'animate-pulse' : ''} />
          {isUploading ? 'Auditing…' : 'Run Audit'}
        </button>
      )}

      {/* Pipeline stepper — show during upload or after if events exist */}
      {(isUploading || wsEvents.length > 0) && !result && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <Zap size={12} className="text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">AI Pipeline Running</h2>
            {isUploading && (
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse ml-auto" />
            )}
          </div>

          {/* Ambient glow */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
          />

          <PipelineStepper events={wsEvents} isRunning={isUploading} />
        </div>
      )}

      {/* Result card */}
      {result && (
        <div
          className="glass-card p-6 animate-fade-in"
          style={{
            borderColor:
              result.status === 'APPROVED'
                ? 'rgba(16,185,129,0.25)'
                : result.status === 'FLAGGED'
                ? 'rgba(239,68,68,0.25)'
                : 'rgba(245,158,11,0.25)',
            background:
              result.status === 'APPROVED'
                ? 'rgba(16,185,129,0.05)'
                : result.status === 'FLAGGED'
                ? 'rgba(239,68,68,0.05)'
                : 'rgba(245,158,11,0.05)',
          }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: result.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              }}
            >
              {result.status === 'APPROVED' ? (
                <CheckCircle size={20} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={20} className="text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-white">Audit Result</h2>
                <StatusBadge status={result.status} />
              </div>
              <p className="text-sm text-slate-300">{result.reason}</p>
            </div>
          </div>

          {result.extracted_data && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-white/[0.06] pt-4 mt-4">
              {[
                { label: 'Invoice #', value: result.extracted_data.invoice_number },
                { label: 'Vendor', value: result.extracted_data.vendor_name },
                { label: 'GSTIN', value: result.extracted_data.vendor_gstin, mono: true },
                { label: 'Base Amount', value: fmt(result.extracted_data.base_amount) },
                { label: 'Tax Amount', value: fmt(result.extracted_data.tax_amount) },
                { label: 'Total Amount', value: fmt(result.extracted_data.total_amount) },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">{f.label}</p>
                  <p className={`text-sm text-slate-200 mt-0.5 ${f.mono ? 'font-mono text-xs' : ''}`}>{f.value}</p>
                </div>
              ))}
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(result.extracted_data.confidence_score * 100).toFixed(0)}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-300">{(result.extracted_data.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button className="btn-secondary text-xs" onClick={reset}>Upload Another</button>
            {/* Navigate to invoices list — we don't have the invoice_id from the response */}
            <button
              className="btn-ghost flex items-center gap-1.5 text-xs px-3"
              onClick={() => navigate('/invoices')}
            >
              <ExternalLink size={13} /> View Invoices
            </button>
          </div>
        </div>
      )}

      {/* Pipeline stepper after result (with all events) */}
      {result && wsEvents.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Pipeline Summary</h3>
          <PipelineStepper events={wsEvents} isRunning={false} />
        </div>
      )}
    </div>
  );
};

export default Audit;
