import { createContext, useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle, Sparkles } from 'lucide-react';

export const ToastContext = createContext();

/* ── per-type visual config ── */
const config = {
  success: {
    Icon:      CheckCircle,
    gradient:  'from-emerald-500 to-teal-500',
    bg:        'bg-emerald-50',
    border:    'border-emerald-200',
    accent:    'bg-emerald-500',
    iconBg:    'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title:     'Success',
  },
  error: {
    Icon:      XCircle,
    gradient:  'from-red-500 to-rose-500',
    bg:        'bg-red-50',
    border:    'border-red-200',
    accent:    'bg-red-500',
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    title:     'Error',
  },
  warning: {
    Icon:      AlertTriangle,
    gradient:  'from-amber-500 to-orange-500',
    bg:        'bg-amber-50',
    border:    'border-amber-200',
    accent:    'bg-amber-500',
    iconBg:    'bg-amber-100',
    iconColor: 'text-amber-600',
    title:     'Warning',
  },
  info: {
    Icon:      Info,
    gradient:  'from-sky-500 to-cyan-500',
    bg:        'bg-sky-50',
    border:    'border-sky-200',
    accent:    'bg-sky-500',
    iconBg:    'bg-sky-100',
    iconColor: 'text-sky-600',
    title:     'Info',
  },
};

/* ── single Toast item ── */
const Toast = ({ toast, onDismiss }) => {
  const { Icon, gradient, bg, border, accent, iconBg, iconColor, title } =
    config[toast.type] ?? config.info;

  return (
    <div
      className={`
        relative flex items-start gap-3
        ${bg} rounded-2xl shadow-2xl border ${border}
        px-4 py-4 pointer-events-auto w-[340px] max-w-full
        animate-slide-in-right overflow-hidden
      `}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Gradient accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient} rounded-l-2xl`} />

      {/* Icon */}
      <div className={`${iconBg} rounded-xl p-2 shrink-0 mt-0.5`}>
        <Icon size={16} className={iconColor} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 mr-1">
        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${iconColor}`}>{title}</p>
        <p className="text-sm font-medium text-slate-800 leading-snug">{toast.message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-lg p-1 transition-all shrink-0 -mr-0.5 -mt-0.5"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-1 right-0 h-0.5 ${accent} opacity-30 rounded-full origin-left`}
        style={{
          animation: `progress-bar ${toast.duration ?? 4000}ms linear forwards`,
        }}
      />
    </div>
  );
};

/* ── provider ── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast stack – bottom-right */}
      <div className="pointer-events-none fixed right-5 bottom-6 z-[9999] flex flex-col-reverse gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
