const colorMap = {
  indigo:  { gradient: 'from-[#E9B38F] to-[#d4956a]', shadow: 'shadow-[#E9B38F]/40' },
  violet:  { gradient: 'from-[#E9B38F] to-[#d4956a]', shadow: 'shadow-[#E9B38F]/40' },
  emerald: { gradient: 'from-emerald-500 to-teal-600',  shadow: 'shadow-emerald-200'  },
  amber:   { gradient: 'from-amber-500 to-orange-500',  shadow: 'shadow-amber-200'    },
  sky:     { gradient: 'from-sky-500 to-cyan-600',      shadow: 'shadow-sky-200'      },
  rose:    { gradient: 'from-rose-500 to-pink-600',     shadow: 'shadow-rose-200'     },
};

const StatsCard = ({ title, value, icon, subtitle, color = 'indigo', trend }) => {
  const c = colorMap[color] ?? colorMap.indigo;
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="mt-3 text-4xl font-black tracking-tighter leading-none text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs text-slate-400 font-medium leading-tight">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`mt-3 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                trend.up ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-red-50 text-red-500 ring-1 ring-red-200'
              }`}
            >
              <span>{trend.up ? '↑' : '↓'}</span>
              <span>{trend.label}</span>
            </div>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br shadow-lg ${c.gradient} ${c.shadow}`}
          style={{ color: '#fff' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
