const variants = {
  default:  { dot: 'bg-slate-400',   label: 'bg-slate-100   text-slate-600   ring-slate-200'   },
  primary:  { dot: 'bg-[#E9B38F]',   label: 'bg-[#E9B38F]/10 text-[#b07040]  ring-[#E9B38F]/30' },
  success:  { dot: 'bg-emerald-500', label: 'bg-emerald-50  text-emerald-700 ring-emerald-200' },
  warning:  { dot: 'bg-amber-400',   label: 'bg-amber-50    text-amber-700   ring-amber-200'   },
  danger:   { dot: 'bg-red-500',     label: 'bg-red-50      text-red-700     ring-red-200'     },
  info:     { dot: 'bg-sky-400',     label: 'bg-sky-50      text-sky-700     ring-sky-200'     },
  violet:   { dot: 'bg-[#E9B38F]',   label: 'bg-[#E9B38F]/10 text-[#b07040]  ring-[#E9B38F]/30' },
};

const Badge = ({ variant = 'default', children, className = '', showDot = false }) => {
  const v = variants[variant] ?? variants.default;
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-[10px] font-bold uppercase tracking-widest
        ring-1 ${v.label}
        ${className}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${v.dot} animate-pulse-soft`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
