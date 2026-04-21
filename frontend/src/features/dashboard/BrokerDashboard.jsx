import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import InlineNavbar from '../../components/layout/InlineNavbar';
import api from '../../services/api';
import { normalizeDeal, normalizeProperty } from '../../utils/normalizers';
import { ROUTES } from '../../utils/constants';
import { getPropertyStatusLabel } from '../../utils/enums';
import {
  AlertCircle, ArrowRight, Building2, ClipboardList,
  TrendingUp, Plus, Bed, Bath, Maximize2, Search, Star,
} from 'lucide-react';

const statusBadgeVariant = {
  AVAILABLE: 'success', PENDING: 'warning', APPROVED: 'info', REJECTED: 'danger',
  RESERVED: 'warning', RENTED: 'primary', SOLD: 'default', OFF_MARKET: 'default',
};

const IMG_FALLBACK = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400';
const FOCAL        = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200';

const BareStat = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-6xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
  </div>
);

const ProgressCard = ({ label, value, sub, pct, peach, secondary, secondaryLabel }) => {
  const bg  = peach ? '#E9B38F1A' : '#ecfdf5';
  const dot = peach ? '#E9B38F'   : '#10b981';
  const lbl = peach ? '#b8703a'   : '#059669';
  return (
    <div className="rounded-[40px] p-7 flex-1" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: dot + '33' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: lbl }}>{label}</p>
      </div>
      <div className="flex items-end justify-between mb-3">
        <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-900 leading-none">{secondary}</p>
          {secondaryLabel && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{secondaryLabel}</p>}
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', backgroundColor: dot }} />
      </div>
      {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
    </div>
  );
};

// Vertical card for Listing Board — broker's own managed properties
const VerticalCard = ({ property }) => {
  const img = property.imageUrls?.[0] || IMG_FALLBACK;
  return (
    <Link to={'/properties/' + property.id} className="block">
      <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 group">
        <div className="h-44 overflow-hidden">
          <img src={img} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none tracking-tighter">
                &#8377;{property.price?.toLocaleString('en-IN')}
                {property.listingType === 'RENT' && <span className="text-xs font-semibold text-slate-400 ml-1">/mo</span>}
              </p>
              <p className="font-bold text-slate-800 text-sm truncate mt-1">{property.title}</p>
              <p className="text-xs text-slate-400 truncate">{property.locality || property.city}</p>
            </div>
            <Badge variant={statusBadgeVariant[property.status] ?? 'default'} className="shrink-0 mt-0.5">
              {getPropertyStatusLabel(property.status)}
            </Badge>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
            {property.bedrooms  != null && <div className="flex items-center gap-1 text-slate-400"><Bed      size={12} strokeWidth={2} /><span className="text-xs font-bold text-slate-600">{property.bedrooms} bd</span></div>}
            {property.bathrooms != null && <div className="flex items-center gap-1 text-slate-400"><Bath     size={12} strokeWidth={2} /><span className="text-xs font-bold text-slate-600">{property.bathrooms} bt</span></div>}
            {property.area      != null && <div className="flex items-center gap-1 text-slate-400"><Maximize2 size={12} strokeWidth={2} /><span className="text-xs font-bold text-slate-600">{property.area} ft</span></div>}
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Main ────────────────────────────────────────────────────────
const BrokerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading]        = useState(true);
  const [error, setError]                = useState('');
  const [managed, setManaged]            = useState([]);
  const [pipeline, setPipeline]          = useState([]);
  const [pending, setPending]            = useState([]);
  const [totalRevenue, setTotalRevenue]  = useState(0);
  const [newListings, setNewListings]    = useState([]);
  const [searchQuery, setSearchQuery]    = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true); setError('');
      try {
        const [mR, dR, pR, rR, nlR] = await Promise.allSettled([
          api.get('/properties/me/managed'),
          api.get('/deals/me/pipeline'),
          api.get('/properties/pending'),
          api.get('/users/me/broker-metrics'),
          api.get('/properties?page=0&size=4'),
        ]);
        if (mR.status  === 'fulfilled') { const d = mR.value.data;  setManaged((d.content ?? d ?? []).map(normalizeProperty)); }
        if (dR.status  === 'fulfilled') { const d = dR.value.data;  setPipeline((d.content ?? d ?? []).map(normalizeDeal)); }
        if (pR.status  === 'fulfilled') { const d = pR.value.data;  setPending((d.content ?? d ?? []).map(normalizeProperty)); }
        if (rR.status  === 'fulfilled') { setTotalRevenue(rR.value.data.totalRevenueAmount ?? 0); }
        if (nlR.status === 'fulfilled') { const d = nlR.value.data; setNewListings((d.content ?? d ?? []).map(normalizeProperty)); }
        if ([mR, dR, pR, rR].every((r) => r.status === 'rejected')) setError('Failed to load dashboard. Please refresh.');
      } catch { setError('Failed to load dashboard. Please refresh.'); }
      finally  { setIsLoading(false); }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const active  = managed.filter((p) => p.status === 'AVAILABLE').length;
    const closed  = pipeline.filter((d) => d.status === 'CLOSED').length;
    const total   = Math.max(pipeline.length, 1);
    return {
      activeListings:   active,
      totalDealsClosed: closed,
      newSubmissions:   pending.length,
      subPct:           Math.min(100, pending.length * 10),
      revenuePct:       Math.min(100, Math.round((totalRevenue / 5_000_000) * 100)),
      recentListings:   newListings.slice(0, 4),   // newest by ANY broker
      boardListings:    managed.slice(0, 3),        // broker's OWN managed
    };
  }, [managed, pending, pipeline, totalRevenue, newListings]);

  if (isLoading) return <PageSpinner message="Loading broker dashboard..." />;

  const revenueLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact',
  }).format(totalRevenue);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? '/properties?search=' + encodeURIComponent(q) : '/properties');
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen">

      {/* ── Hero band ── */}
      <div className="bg-white relative overflow-hidden">
        {/* Gradient tint */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(145deg, #E9B38F30 0%, #E9B38F14 45%, transparent 75%)' }} />
        {/* Dot-grid texture */}
        <div className="absolute inset-0 dot-grid-dark pointer-events-none" />
        {/* Top-left depth blob */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none bg-slate-400" />
        {/* Bottom-right accent blob */}
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ backgroundColor: '#E9B38F' }} />

        {/* Navbar */}
        <div className="relative">
          <InlineNavbar variant="light" />
        </div>

        {/* Header content */}
        <div className="relative px-6 md:px-10 pt-2 pb-8 animate-slide-up">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold mb-3 uppercase tracking-widest" style={{ color: '#E9B38F', borderColor: '#E9B38F55', backgroundColor: '#E9B38F18' }}>
                <TrendingUp size={9} strokeWidth={2.5} /> Broker Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[0.9]">Broker Overview</h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">{today}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2.5">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties..."
                    className="bg-transparent text-sm text-slate-700 outline-none w-44 placeholder:text-slate-400"
                  />
                </div>
              </form>
              <Link to={ROUTES.ADD_PROPERTY} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-black text-slate-900 rounded-full active:scale-95 transition-all" style={{ backgroundColor: '#E9B38F' }}>
                <Plus size={14} strokeWidth={2.5} /> Add Listing
              </Link>
              <Link to="/pipeline" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-slate-600 rounded-full border border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                Pipeline
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 md:px-10 py-8 pb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm mb-6">
            <AlertCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[3fr_1.5fr] gap-10 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-8">

            {/* Bare stats */}
            <div className="grid grid-cols-2 gap-6 sm:gap-10">
              <BareStat label="Active Listings" value={stats.activeListings} />
              <BareStat label="Deals Closed"    value={stats.totalDealsClosed} />
            </div>

            {/* Focal image */}
            <div className="h-80 rounded-[40px] overflow-hidden shadow-xl">
              <img src={FOCAL} alt="Luxury Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>

            {/* Progress cards */}
            <div className="flex flex-col sm:flex-row gap-6">
              <ProgressCard label="Owner Submissions" value={stats.newSubmissions} sub="Awaiting your review" pct={stats.subPct}    peach secondary={stats.newSubmissions}       secondaryLabel="pending" />
              <ProgressCard label="Total Revenue"     value={revenueLabel}          sub="From closed deals"  pct={stats.revenuePct}       secondary={stats.totalDealsClosed} secondaryLabel="closed" />
            </div>

            {/* Recent Listings — newest by ANY broker */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2">Platform</span>
                  <h2 className="font-black text-slate-900 tracking-tight">Recent Listings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Newest properties added by any broker</p>
                </div>
                <Link to="/properties" className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
                  View all <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
              {stats.recentListings.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-sm">No listings available yet</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {stats.recentListings.map((property) => (
                    <Link key={property.id} to={'/properties/' + property.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                          {property.imageUrls?.[0]
                            ? <img src={property.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                            : <Building2 size={16} strokeWidth={2} className="text-slate-400 m-auto mt-3" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm">{property.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{property.locality || property.city} &middot; &#8377;{property.price?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={statusBadgeVariant[property.status] ?? 'default'}>{getPropertyStatusLabel(property.status)}</Badge>
                        <ArrowRight size={14} strokeWidth={2} className="text-slate-200 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Reviews — placeholder (no backend endpoint yet) */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2">Reputation</span>
                <h2 className="font-black text-slate-900 tracking-tight">Customer Reviews</h2>
                <p className="text-xs text-slate-400 mt-0.5">Feedback from your clients</p>
              </div>
              <div className="px-8 py-14 flex flex-col items-center text-center">
                <div className="flex gap-1.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={22} strokeWidth={1.5} className={s <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'} />
                  ))}
                </div>
                <p className="font-black text-slate-900 text-lg tracking-tight mb-1">Reviews coming soon</p>
                <p className="text-xs text-slate-400 max-w-xs">Customer reviews and ratings will appear here once the feature is enabled. Keep closing deals to build your reputation!</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — broker's OWN managed properties */}
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2 block">Inventory</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Listing Board</h2>
                <p className="text-xs text-slate-400 mt-1">Your managed properties</p>
              </div>
              <Link to={ROUTES.MANAGED_PROPERTIES} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-1">
                View all <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>

            {stats.boardListings.length === 0 ? (
              <div className="bg-white rounded-[40px] p-10 text-center border border-slate-100">
                <p className="text-slate-400 text-sm">No managed listings yet</p>
                <Link to={ROUTES.ADD_PROPERTY} className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 text-sm font-black text-slate-900 rounded-full" style={{ backgroundColor: '#E9B38F' }}>
                  <Plus size={13} strokeWidth={2.5} /> Add Property
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {stats.boardListings.map((p) => <VerticalCard key={p.id} property={p} />)}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link to={ROUTES.OWNER_SUBMISSIONS} className="flex items-center gap-4 p-5 bg-white rounded-[40px] border border-slate-100 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E9B38F22' }}>
                  <ClipboardList size={18} strokeWidth={2} style={{ color: '#E9B38F' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm tracking-tight">Review Submissions</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stats.newSubmissions} pending review</p>
                </div>
                <ArrowRight size={15} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
              <Link to="/pipeline" className="flex items-center gap-4 p-5 bg-white rounded-[40px] border border-slate-100 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} strokeWidth={2} className="text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm tracking-tight">Deal Pipeline</p>
                  <p className="text-xs text-slate-400 mt-0.5">{pipeline.length} total deals tracked</p>
                </div>
                <ArrowRight size={15} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
