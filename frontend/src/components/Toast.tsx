import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast as ToastType } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
  info: <Info size={16} className="text-blue-400" />,
};

const bgMap = {
  success: 'border-emerald-500/20 bg-emerald-500/5',
  error: 'border-red-500/20 bg-red-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm animate-fade-in ${bgMap[toast.type]}`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          <span className="flex-shrink-0 mt-0.5">{icons[toast.type]}</span>
          <span className="flex-1 text-sm text-slate-200 leading-relaxed">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
