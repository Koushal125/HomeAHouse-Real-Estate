import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart2, Eye, IndianRupee, Building2, AlertCircle } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';
import StatsCard from '../../components/common/StatsCard';
import { PageSpinner } from '../../components/ui/Spinner';
import api from '../../services/api';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const BrokerAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users/me/analytics')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load analytics. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <PageSpinner message="Loading analytics…" />;

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm">
        <AlertCircle size={16} className="shrink-0" />
        {error}
      </div>
    );
  }

  // ── Prepare chart data ───────────────────────────────────────────────────

  const viewsData = (data.topPropertiesByViews || []).map((p) => ({
    name: p.title.length > 16 ? p.title.slice(0, 15) + '…' : p.title,
    views: p.viewCount,
    fullTitle: p.title,
    city: p.city,
  }));

  const typeData = Object.entries(data.propertyTypeBreakdown || {}).map(([type, count]) => ({
    name: type.charAt(0) + type.slice(1).toLowerCase(),
    value: Number(count),
  }));

  const funnelData = [
    { stage: 'Pending', count: Number(data.dealsPending ?? 0) },
    { stage: 'Under Contract', count: Number(data.dealsUnderContract ?? 0) },
    { stage: 'Closed', count: Number(data.dealsClosed ?? 0) },
  ];

  const formatRupee = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <PageShell
      label="Analytics"
      icon={<BarChart2 size={10} strokeWidth={2.5} />}
      title="Portfolio Analytics"
      subtitle="Views, property mix, and deal pipeline health across your listings."
      accentHex="#10b981"
    >
      <div className="space-y-8 animate-slide-up">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Views"
          value={String(data.totalViews ?? 0)}
          icon={<Eye size={20} />}
          subtitle="Across all your listings"
          color="amber"
        />
        <StatsCard
          title="Total Revenue"
          value={formatRupee(data.totalRevenue ?? 0)}
          icon={<IndianRupee size={20} />}
          subtitle="From closed deals"
          color="emerald"
        />
        <StatsCard
          title="Active Listings"
          value={String(data.activeListings ?? 0)}
          icon={<Building2 size={20} />}
          subtitle="Currently on market"
          color="amber"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Views per property — takes 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-6">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2 block">Views</span>
          <h2 className="font-black text-slate-900 tracking-tight mb-1">Top Properties by Views</h2>
          <p className="text-xs text-slate-400 mb-5">Your 10 most-viewed listings</p>
          {viewsData.length === 0 ? (
            <EmptyState message="No view data yet. Views accumulate as visitors open property pages." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={viewsData} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Views']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ''}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="views" fill="#E9B38F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Property type pie — 1/3 width */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2 block">Portfolio</span>
          <h2 className="font-black text-slate-900 tracking-tight mb-1">Property Mix</h2>
          <p className="text-xs text-slate-400 mb-5">Breakdown by type</p>
          {typeData.length === 0 ? (
            <EmptyState message="No listings yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, name]}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Deal funnel ── */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-600 text-[9px] font-bold uppercase tracking-widest mb-2 block">Pipeline</span>
        <h2 className="font-black text-slate-900 tracking-tight mb-1">Deal Pipeline</h2>
        <p className="text-xs text-slate-400 mb-5">Count of deals at each stage</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 40, left: 20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} width={110} />
            <Tooltip
              formatter={(v) => [v, 'Deals']}
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {funnelData.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? '#f59e0b' : i === 1 ? '#6366f1' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top viewed table ── */}
      {(data.topPropertiesByViews || []).length > 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2">Rankings</span>
            <h2 className="font-black text-slate-900 tracking-tight">Top 10 Properties by Views</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/60">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.topPropertiesByViews.map((p, i) => (
                <tr key={p.propId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-3 font-black text-slate-800">{p.title}</td>
                  <td className="px-6 py-3 text-slate-500">{p.city}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-bold text-amber-600">{p.viewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </PageShell>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex items-center justify-center h-40 text-sm text-slate-400 text-center px-4">
    {message}
  </div>
);

export default BrokerAnalytics;
