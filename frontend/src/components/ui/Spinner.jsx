const sizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
  xl: 'h-16 w-16 border-4',
};

export const Spinner = ({ size = 'md', className = '' }) => (
  <div
    className={`
      animate-spin rounded-full
      border-amber-100 border-t-amber-600
      ${sizes[size] ?? sizes.md}
      ${className}
    `}
    style={{ filter: 'drop-shadow(0 0 6px rgba(233,179,143,0.5))' }}
  />
);

export const PageSpinner = ({ message = 'Loading…' }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 animate-fade-in">
    {/* Layered spinner rings */}
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute w-24 h-24 rounded-full border-4 border-amber-100 opacity-50" />
      {/* Animated ring 1 */}
      <div
        className="absolute w-20 h-20 rounded-full border-4 border-transparent border-t-amber-300"
        style={{ animation: 'spin 2s linear infinite' }}
      />
      {/* Animated ring 2 - opposite direction */}
      <div
        className="absolute w-14 h-14 rounded-full border-[3px] border-transparent border-t-orange-400"
        style={{ animation: 'spin 1.2s linear infinite reverse' }}
      />
      {/* Core dot */}
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse-soft" />
    </div>

    <div className="text-center">
      <p className="text-slate-700 text-sm font-semibold">{message}</p>
      <div className="mt-2 flex items-center justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            style={{
              animation: 'pulse-soft 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const InlineSpinner = ({ message = '' }) => (
  <div className="flex items-center justify-center gap-3 py-8 animate-fade-in">
    <Spinner size="sm" />
    {message && <p className="text-slate-500 text-sm">{message}</p>}
  </div>
);

export const SkeletonBox = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
    <SkeletonBox className="h-52 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <SkeletonBox className="h-4 w-3/4" />
      <SkeletonBox className="h-3 w-1/2" />
      <div className="pt-2">
        <SkeletonBox className="h-7 w-1/3" />
      </div>
      <div className="flex gap-2 pt-1">
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-3 w-16" />
      </div>
      <SkeletonBox className="h-10 w-full mt-2" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
    <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonBox className="h-3.5 w-2/5" />
      <SkeletonBox className="h-3 w-1/4" />
    </div>
    <SkeletonBox className="h-6 w-20 rounded-full" />
  </div>
);

export const SkeletonStatCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-8 w-16" />
        <SkeletonBox className="h-3 w-32" />
      </div>
      <SkeletonBox className="h-12 w-12 rounded-2xl shrink-0" />
    </div>
  </div>
);

export default Spinner;
