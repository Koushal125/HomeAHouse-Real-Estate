import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import InlineNavbar from '../../components/layout/InlineNavbar';
import api from '../../services/api';
import { normalizeUserProfile, normalizeProperty } from '../../utils/normalizers';
import { ROUTES } from '../../utils/constants';
import { formatEnumLabel, getPropertyStatusLabel } from '../../utils/enums';
import {
  AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Home, Key, Search,
  Star, Building2, Bed, Bath, Maximize2, ThumbsUp, Clock,
} from 'lucide-react';

const statusBadgeVariant = {
  AVAILABLE: 'success', PENDING: 'warning', APPROVED: 'info', REJECTED: 'danger',
  RESERVED: 'violet', RENTED: 'primary', SOLD: 'default', OFF_MARKET: 'default',
};

const FOCAL       = 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1500';
const IMG_FALLBACK = 'https://images.unsplash.com/photo-1600585154340-be6191da95b8?auto=format&fit=crop&q=80&w=400';

// Bare big-number stat
const BareStat = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-6xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
  </div>
);

// Stat card
const ProgressCard = ({ label, value, sub, peach }) => {
  const bg      = peach ? '#E9B38F1A' : '#ecfdf5';
  const dot     = peach ? '#E9B38F'   : '#10b981';
  const label_c = peach ? '#b8703a'   : '#059669';
  return (
    <div className="rounded-[40px] p-7 flex-1" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: dot + '33' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: label_c }}>{label}</p>
      </div>
      <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter mb-2">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
};

// Vertical listing board card (image on top)
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
            {property.bedrooms != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <Bed size={12} strokeWidth={2} />
                <span className="text-xs font-bold text-slate-600">{property.bedrooms} bd</span>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <Bath size={12} strokeWidth={2} />
                <span className="text-xs font-bold text-slate-600">{property.bathrooms} bt</span>
              </div>
            )}
            {property.area != null && (
              <div className="flex items-center gap-1 text-slate-400">
                <Maximize2 size={12} strokeWidth={2} />
                <span className="text-xs font-bold text-slate-600">{property.area} ft</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// New Listings carousel (2 cards per page, shown in left column)
const NewListingsCarousel = ({ listings }) => {
  const [idx, setIdx] = useState(0);
  const PER_PAGE = 2;
  const pages    = Math.ceil(listings.length / PER_PAGE);
  const visible  = listings.slice(idx * PER_PAGE, idx * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2">Just Added</span>
          <h2 className="font-black text-slate-900 tracking-tight">New Listings</h2>
          <p className="text-xs text-slate-400 mt-0.5">{listings.length} fresh properties</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(pages - 1, i + 1))}
            disabled={idx === pages - 1}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-5">
          {visible.map((p) => <VerticalCard key={p.id} property={p} />)}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === idx ? '#E9B38F' : '#e2e8f0', width: i === idx ? '20px' : '8px' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading]               = useState(true);
  const [error, setError]                       = useState('');
  const [profile, setProfile]                   = useState(null);
  const [savedCount, setSavedCount]             = useState(0);
  const [recentlyViewed, setRecentlyViewed]     = useState([]);
  const [recommended, setRecommended]           = useState([]);
  const [newListings, setNewListings]           = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true); setError('');
      try {
        const [prR, mR, rvR, recR, nlR] = await Promise.allSettled([
          api.get('/users/me'),
          api.get('/users/me/metrics'),
          api.get('/properties/me/recently-viewed'),
          api.get('/properties/recommended'),
          api.get('/properties?page=0&size=6'),
        ]);
        if (prR.status  === 'fulfilled') setProfile(normalizeUserProfile(prR.value.data));
        if (mR.status   === 'fulfilled') setSavedCount(mR.value.data.savedListingsCount ?? 0);
        if (rvR.status  === 'fulfilled') setRecentlyViewed((rvR.value.data ?? []).map(normalizeProperty));
        if (recR.status === 'fulfilled') setRecommended((recR.value.data ?? []).map(normalizeProperty));
        if (nlR.status  === 'fulfilled') { const d = nlR.value.data; setNewListings((d.content ?? d ?? []).map(normalizeProperty)); }
      } catch { setError('Failed to load dashboard. Please refresh.'); }
      finally  { setIsLoading(false); }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const properties = profile?.properties ?? [];
    const owned   = properties.length;
    const rentals = properties.filter((p) => p.status === 'RENTED').length;
    const board   = (recommended.length > 0 ? recommended : recentlyViewed).slice(0, 3);
    return {
      ownedProperties:  owned,
      activeRentals:    rentals,
      savedPct:         Math.min(100, savedCount * 5),
      recentPct:        Math.min(100, recentlyViewed.length * 10),
      recentProperties: properties.slice(0, 4),
      boardItems:       board,
      boardIsRec:       recommended.length > 0,
      newListings:      newListings.slice(0, 6),
    };
  }, [profile, savedCount, recentlyViewed, recommended, newListings]);

  if (isLoading) return <PageSpinner message="Loading your dashboard..." />;

  const firstName = profile?.name?.split(' ')[0] || 'there';
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
                <Home size={9} strokeWidth={2.5} /> Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[0.9]">Welcome back, {firstName}</h1>
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
              <Link to="/properties" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-black text-slate-900 rounded-full active:scale-95 transition-all" style={{ backgroundColor: '#E9B38F' }}>
                <Search size={14} strokeWidth={2.5} /> Browse
              </Link>
              <Link to={ROUTES.SAVED_LISTINGS} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-slate-600 rounded-full border border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white transition-all">
                <Star size={13} strokeWidth={2} /> Saved
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="px-6 md:px-10 py-8 pb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm mb-6">
            <AlertCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[3fr_1.5fr] gap-10 items-start">

          {/* LEFT */}
          <div className="space-y-8">

            {/* Bare stats */}
            <div className="grid grid-cols-2 gap-6 sm:gap-10">
              <BareStat label={'Welcome back, ' + firstName} value={stats.ownedProperties + ' Properties'} />
              <BareStat label="Active Rentals"               value={stats.activeRentals} />
            </div>

            {/* Focal image */}
            <div className="h-80 rounded-[40px] overflow-hidden shadow-xl">
              <img src={FOCAL} alt="Luxury Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>

            {/* Progress cards */}
            <div className="flex flex-col sm:flex-row gap-6">
              <ProgressCard label="Saved Listings"   value={savedCount}            sub="Properties you have saved" peach />
              <ProgressCard label="Recently Viewed"  value={recentlyViewed.length} sub="Properties browsed" />
            </div>

            {/* My Properties panel */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2">Portfolio</span>
                  <h2 className="font-black text-slate-900 tracking-tight">My Properties</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{stats.ownedProperties} properties total</p>
                </div>
                <Link to={ROUTES.MY_PROPERTIES} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
                  View all <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
              {stats.recentProperties.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Home size={24} strokeWidth={2} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-500 mb-1">No properties yet</p>
                  <p className="text-xs text-slate-400 mb-6">Start exploring available listings.</p>
                  <Link to="/properties" className="inline-flex items-center gap-1.5 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm" style={{ backgroundColor: '#E9B38F' }}>
                    <Search size={14} strokeWidth={2.5} /> Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {stats.recentProperties.map((property) => (
                    <Link key={property.id} to={'/properties/' + property.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Building2 size={16} strokeWidth={2} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm">{property.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {property.locality || property.city}
                            {property.propertyType && ' \u00b7 ' + formatEnumLabel(property.propertyType)}
                            {property.price && ' \u00b7 \u20b9' + property.price.toLocaleString('en-IN')}
                          </p>
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

            {/* New Listings carousel — below My Properties, beside the action buttons */}
            {stats.newListings.length > 0 && (
              <NewListingsCarousel listings={stats.newListings} />
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <Link
              to={ROUTES.SUBMIT_PROPERTY}
              className="flex items-center justify-between gap-3 w-full px-6 py-4 rounded-[40px] font-black text-sm text-slate-900 transition-all duration-200 active:scale-[0.98] shadow-sm"
              style={{ backgroundColor: '#E9B38F' }}
            >
              <span>Submit a Property</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <div className="space-y-3 pt-2">
              <Link to={ROUTES.MY_SUBMISSIONS} className="flex items-center gap-4 p-5 bg-white rounded-[40px] border border-slate-100 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E9B38F22' }}>
                  <Home size={18} strokeWidth={2} style={{ color: '#E9B38F' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm tracking-tight">My Submissions</p>
                  <p className="text-xs text-slate-400 mt-0.5">Track your property submissions</p>
                </div>
                <ArrowRight size={15} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
              <Link to={ROUTES.MY_TRANSACTIONS} className="flex items-center gap-4 p-5 bg-white rounded-[40px] border border-slate-100 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Key size={18} strokeWidth={2} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm tracking-tight">My Transactions</p>
                  <p className="text-xs text-slate-400 mt-0.5">View your deal history</p>
                </div>
                <ArrowRight size={15} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
              <Link to={ROUTES.SAVED_LISTINGS} className="flex items-center gap-4 p-5 bg-white rounded-[40px] border border-slate-100 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Star size={18} strokeWidth={2} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm tracking-tight">Saved Listings</p>
                  <p className="text-xs text-slate-400 mt-0.5">{savedCount} saved properties</p>
                </div>
                <ArrowRight size={15} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#E9B38F55] bg-[#E9B38F18] text-[#E9B38F] text-[9px] font-bold uppercase tracking-widest mb-2 block">{stats.boardIsRec ? 'Discover' : 'Recent'}</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                  {stats.boardIsRec
                    ? <><ThumbsUp size={18} strokeWidth={2} className="text-slate-400" /> For You</>
                    : <><Clock size={18} strokeWidth={2} className="text-slate-400" /> Recently Viewed</>
                  }</h2>
              </div>
              <Link to="/properties" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-1">
                Browse all <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>

            {stats.boardItems.length === 0 ? (
              <div className="bg-white rounded-[40px] p-10 text-center border border-slate-100">
                <p className="text-slate-400 text-sm">Browse listings to see them here</p>
              </div>
            ) : (
              <div className="space-y-5">
                {stats.boardItems.map((p) => <VerticalCard key={p.id} property={p} />)}
              </div>
            )}



          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
