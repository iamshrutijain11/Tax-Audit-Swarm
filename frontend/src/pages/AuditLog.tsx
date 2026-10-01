import React, { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, Trash2 } from 'lucide-react';
import { getWsUrl } from '../api/client';
import type { AuditLogEvent } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const agentColors: Record<string, string> = {
  Agent1_Vision: '#3b82f6',
  Agent2_Ledger: '#8b5cf6',
  Agent3_Tax: '#10b981',
  Pipeline: '#f59e0b',
};

interface FeedEvent extends AuditLogEvent {
  receivedAt: string;
}

const AuditLog: React.FC = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const connect = () => {
    const url = getWsUrl('/ws/audit-logs');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectRef.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try {
        const event: AuditLogEvent = JSON.parse(e.data);
        setEvents(prev => [{ ...event, receivedAt: new Date().toISOString() }, ...prev].slice(0, 200));
      } catch {
        // ignore
      }
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Live Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time WebSocket feed from the audit pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <Wifi size={14} className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.8))' }} />
                <span className="text-xs text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="text-xs text-red-400">Reconnecting…</span>
              </>
            )}
          </div>
          <button
            className="btn-secondary text-xs"
            onClick={() => setEvents([])}
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Header bar */}
        <div
          className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2"
          style={{
            background: connected
              ? 'rgba(16,185,129,0.04)'
              : 'rgba(239,68,68,0.04)',
          }}
        >
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'} ${connected ? 'animate-pulse' : ''}`}
            style={connected ? { boxShadow: '0 0 6px rgba(52,211,153,0.8)' } : {}}
          />
          <span className="text-xs font-medium text-slate-400">
            {connected ? 'Live' : 'Disconnected'} · {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Feed */}
        <div className="max-h-[60vh] overflow-y-auto">
          {events.length === 0 ? (
            <div className="py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <Wifi size={24} className="text-violet-500" />
              </div>
              <p className="text-slate-500 text-sm">Waiting for audit events…</p>
              <p className="text-slate-600 text-xs mt-1">Upload an invoice to see the pipeline in action.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {events.map((ev, i) => {
                const color = agentColors[ev.agent] ?? '#64748b';
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors animate-fade-in">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}80` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color }}>{ev.agent}</span>
                        <span className="text-xs text-slate-600">→</span>
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        Invoice: {ev.invoice_id}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {new Date(ev.receivedAt).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
