const ACCENT = '#E9B38F';

const variants = {
  primary:   'text-slate-900 hover:opacity-90 shadow-lg active:scale-[0.98]',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md active:scale-[0.98]',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]',
  danger:    'bg-red-600 text-white hover:bg-red-500 shadow-sm active:scale-[0.98]',
  success:   'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm active:scale-[0.98]',
  warning:   'text-slate-900 hover:opacity-90 shadow-sm active:scale-[0.98]',
  outline:   'text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]',
  soft:      'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]',
  dark:      'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]',
};

const primaryInlineStyle = { backgroundColor: ACCENT, boxShadow: `0 8px 32px 0 ${ACCENT}55` };

const sizes = {
  xs: 'px-3   py-1.5 text-xs  rounded-full gap-1',
  sm: 'px-4   py-2   text-xs  rounded-full gap-1.5',
  md: 'px-5   py-2.5 text-sm  rounded-full gap-2',
  lg: 'px-7   py-3   text-base rounded-full gap-2',
  xl: 'px-9   py-4   text-base rounded-full gap-2.5',
};

const Button = ({
  variant  = 'primary',
  size     = 'md',
  children,
  className = '',
  disabled,
  loading,
  style,
  ...props
}) => {
  const isPrimary = variant === 'primary' || variant === 'warning';
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] ?? variants.primary}
        ${sizes[size]    ?? sizes.md}
        ${className}
      `}
      style={isPrimary ? { ...primaryInlineStyle, ...style } : style}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
