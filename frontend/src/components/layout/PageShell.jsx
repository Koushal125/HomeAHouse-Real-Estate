import InlineNavbar from './InlineNavbar';

/**
 * PageShell — shared wrapper for every inner page.
 *
 * Renders:
 *   1. InlineNavbar (light variant) floating on a hero gradient band
 *   2. Gradient header band with label chip + large title + subtitle below the navbar
 *   3. bg-slate-50 padded content area
 *
 * Props:
 *   title       {string}    — large page heading (required)
 *   subtitle    {string}    — small description line (optional)
 *   label       {string}    — ALL-CAPS chip above title (optional)
 *   icon        {ReactNode} — icon rendered inside the label chip (optional)
 *   accentHex   {string}    — e.g. "#E9B38F" — drives the gradient tint + chip colour
 *   actions     {ReactNode} — CTA buttons rendered top-right of the hero band (optional)
 *   children    {ReactNode} — page content
 */
const PageShell = ({
  title,
  subtitle,
  label,
  icon,
  accentHex = '#E9B38F',
  actions,
  children,
}) => {
  const heroGradient = {
    background: `linear-gradient(145deg, ${accentHex}30 0%, ${accentHex}14 45%, transparent 75%)`,
  };

  const chipStyle = {
    color: accentHex,
    borderColor: accentHex + '55',
    backgroundColor: accentHex + '18',
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">

      {/* ── Hero band: navbar + heading ── */}
      <div className="bg-white relative overflow-hidden">
        {/* Tinted gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={heroGradient} />

        {/* Dot-grid texture */}
        <div className="absolute inset-0 dot-grid-dark pointer-events-none" />

        {/* Top-left slate depth blob */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none bg-slate-400" />

        {/* Bottom-right accent blob */}
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: accentHex }}
        />

        {/* Navbar */}
        <div className="relative">
          <InlineNavbar variant="light" />
        </div>

        {/* Header content */}
        <div className="relative px-6 md:px-10 pt-4 pb-10 md:pb-12 animate-slide-up">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              {label && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold mb-4 uppercase tracking-widest"
                  style={chipStyle}
                >
                  {icon && <span className="shrink-0">{icon}</span>}
                  {label}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-500 mt-3 text-sm max-w-lg leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3 shrink-0 mb-1">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="px-6 md:px-10 py-8 pb-16 animate-slide-up" style={{ animationDelay: '0.08s' }}>
        {children}
      </div>
    </div>
  );
};

export default PageShell;
