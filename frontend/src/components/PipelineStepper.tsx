import React from 'react';
import { Eye, BookOpen, Shield, GitMerge, Check, Loader2, AlertCircle } from 'lucide-react';
import type { AuditLogEvent } from '../api/client';

type Agent = 'Agent1_Vision' | 'Agent2_Ledger' | 'Agent3_Tax' | 'Pipeline';

interface StepState {
  agent: Agent;
  status: 'idle' | 'running' | 'done' | 'error';
  message?: string;
}

interface PipelineStepperProps {
  events: AuditLogEvent[];
  isRunning: boolean;
}

const agentMeta: Record<Agent, { label: string; sublabel: string; icon: React.ReactNode; color: string }> = {
  Agent1_Vision: {
    label: 'Vision Agent',
    sublabel: 'OCR & Extraction',
    icon: <Eye size={20} />,
    color: '#3b82f6',
  },
  Agent2_Ledger: {
    label: 'Ledger Agent',
    sublabel: 'Amount Reconciliation',
    icon: <BookOpen size={20} />,
    color: '#8b5cf6',
  },
  Agent3_Tax: {
    label: 'Tax Compliance',
    sublabel: 'GST Validation',
    icon: <Shield size={20} />,
    color: '#10b981',
  },
  Pipeline: {
    label: 'Pipeline',
    sublabel: 'Final Verdict',
    icon: <GitMerge size={20} />,
    color: '#f59e0b',
  },
};

const agentOrder: Agent[] = ['Agent1_Vision', 'Agent2_Ledger', 'Agent3_Tax', 'Pipeline'];

const PipelineStepper: React.FC<PipelineStepperProps> = ({ events, isRunning }) => {
  // Derive step states from events
  const stepStates: StepState[] = agentOrder.map(agent => {
    const agentEvents = events.filter(e => e.agent === agent);
    if (agentEvents.length === 0) return { agent, status: 'idle' };
    const last = agentEvents[agentEvents.length - 1];
    const statusStr = String(last.status);
    const statusUpper = statusStr.toUpperCase();
    
    // Backend broadcasts boolean True/False for Agent2/Agent3 is_valid/is_compliant
    if (statusStr === 'True' || statusStr === 'true' || statusUpper === 'APPROVED' || statusUpper === 'DONE' || statusUpper === 'COMPLETED' || statusUpper === 'EXTRACTED' || statusUpper === 'VALIDATED') {
      return { agent, status: 'done', message: statusStr };
    }
    if (statusStr === 'False' || statusStr === 'false' || statusUpper === 'FLAGGED' || statusUpper === 'FAILED' || statusUpper === 'ERROR') {
      return { agent, status: 'error', message: statusStr };
    }
    return { agent, status: 'running', message: statusStr };
  });

  // Determine which agent is currently active
  const activeIdx = stepStates.findIndex(s => s.status === 'running');

  return (
    <div className="space-y-4">
      {/* Timeline container */}
      <div className="flex flex-col gap-0">
        {stepStates.map((step, idx) => {
          const meta = agentMeta[step.agent];
          const isActive = step.status === 'running';
          const isDone = step.status === 'done';
          const isError = step.status === 'error';
          const isIdle = step.status === 'idle';

          return (
            <div key={step.agent} className="flex gap-4">
              {/* Connector line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{
                    background: isIdle
                      ? 'rgba(255,255,255,0.04)'
                      : isDone
                      ? `${meta.color}22`
                      : isError
                      ? 'rgba(239,68,68,0.15)'
                      : `${meta.color}33`,
                    border: isIdle
                      ? '1px solid rgba(255,255,255,0.08)'
                      : isDone
                      ? `1px solid ${meta.color}40`
                      : isError
                      ? '1px solid rgba(239,68,68,0.4)'
                      : `2px solid ${meta.color}`,
                    boxShadow: isActive
                      ? `0 0 20px ${meta.color}60`
                      : isDone
                      ? `0 0 10px ${meta.color}30`
                      : 'none',
                    color: isIdle ? '#64748b' : isDone ? meta.color : isError ? '#ef4444' : meta.color,
                  }}
                >
                  {isActive && isRunning ? (
                    <Loader2 size={20} className="animate-spin" style={{ color: meta.color }} />
                  ) : isDone ? (
                    <Check size={18} style={{ color: meta.color }} />
                  ) : isError ? (
                    <AlertCircle size={18} className="text-red-400" />
                  ) : (
                    <span style={{ opacity: isIdle ? 0.4 : 1 }}>{meta.icon}</span>
                  )}
                </div>
                {idx < agentOrder.length - 1 && (
                  <div
                    className="w-0.5 h-8 transition-all duration-500"
                    style={{
                      background: isDone
                        ? `linear-gradient(to bottom, ${meta.color}, rgba(255,255,255,0.05))`
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-sm font-semibold transition-all duration-300 ${
                      isIdle ? 'text-slate-600' : isDone ? 'text-white' : isError ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    {meta.label}
                  </span>
                  {isActive && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}40`,
                      }}
                    >
                      Processing…
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {step.message || 'Done'}
                    </span>
                  )}
                  {isError && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      {step.message || 'Error'}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isIdle ? 'text-slate-700' : 'text-slate-500'}`}>
                  {meta.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${((activeIdx + 1) / agentOrder.length) * 100}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              boxShadow: '0 0 10px rgba(139,92,246,0.5)',
            }}
          />
        </div>
      )}

      {/* All done */}
      {!isRunning && stepStates.every(s => s.status === 'done') && (
        <div
          className="text-center py-3 rounded-xl text-sm font-medium text-emerald-400"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          ✓ Pipeline complete — all agents finished
        </div>
      )}
    </div>
  );
};

export default PipelineStepper;
