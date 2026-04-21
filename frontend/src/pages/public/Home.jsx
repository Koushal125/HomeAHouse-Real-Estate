import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES, ROLES } from '../../utils/constants';
import InlineNavbar from '../../components/layout/InlineNavbar';
import {
  ArrowRight, BadgeCheck, Building2, MapPin, Search,
  Shield, Star, TrendingUp, Users, Sparkles, CheckCircle,
  Award,
} from 'lucide-react';

/* -- static data -- */
const STATS = [
  { label: 'Properties Listed', value: '2,400+', icon: Building2, color: 'text-amber-600',   bg: 'bg-amber-50'   },
  { label: 'Happy Clients',     value: '1,800+', icon: Users,     color: 'text-orange-600',  bg: 'bg-orange-50'  },
  { label: 'Cities Covered',   value: '120+',   icon: MapPin,    color: 'text-sky-600',    bg: 'bg-sky-50'    },
  { label: 'Deals Closed',     value: '950+',   icon: Award,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const PROPERTY_TYPES = [
  { type: 'FLAT',       emoji: '\u{1F3E2}', label: 'Flat',       count: '840+' },
  { type: 'VILLA',      emoji: '\u{1F3E1}', label: 'Villa',      count: '120+' },
  { type: 'PLOT',       emoji: '\u{1F33F}', label: 'Plot',       count: '340+' },
  { type: 'APARTMENT',  emoji: '\u{1F3EC}', label: 'Apartment',  count: '560+' },
  { type: 'SHOP',       emoji: '\u{1F3EA}', label: 'Shop',       count: '210+' },
  { type: 'COMMERCIAL', emoji: '\u{1F3D7}', label: 'Commercial', count: '90+'  },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Filter by price, location, type and size to discover the perfect property instantly.',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'shadow-slate-200',
  },
  {
    icon: TrendingUp,
    title: 'Broker Tools',
    description: 'Dedicated pipelines and dashboards for brokers to manage deals and inventory with ease.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-200',
  },
  {
    icon: Shield,
    title: 'Secure Transactions',
    description: 'End-to-end deal tracking with verified records keeps every transaction transparent.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-200',
  },
  {
    icon: Users,
    title: 'Owner Portal',
    description: 'Submit listings, track approvals, and monitor your portfolio in real time.',
    gradient: 'from-sky-500 to-cyan-600',
    glow: 'shadow-sky-200',
  },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Sign up in under a minute as a buyer, renter, or property owner.', color: 'from-slate-700 to-slate-800'  },
  { n: '02', title: 'Browse or submit',  desc: 'Explore verified listings or submit your property for review.',   color: 'from-amber-500 to-amber-600'  },
  { n: '03', title: 'Connect & close',   desc: 'Work with our brokers to finalise your deal securely.',           color: 'from-orange-500 to-amber-700' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma',  role: 'Homebuyer',     text: 'Found my dream apartment in Pune within 2 weeks. The process was incredibly smooth.', initial: 'PS' },
  { name: 'Rajesh Mehta',  role: 'Property Owner', text: 'Submitted my property and got it approved in 3 days. Amazing platform for owners.', initial: 'RM' },
  { name: 'Anita Gupta',   role: 'Broker Partner', text: 'The broker dashboard is powerful. Managing 40+ listings has never been easier.', initial: 'AG' },
];

/* -- component -- */
const Home = () => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('buy');

  useEffect(() => {
    const tabs = ['buy', 'rent', 'list'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % tabs.length;
      setActiveTab(tabs[i]);
    }, 1800);
    return () => clearInterval(id);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  const listPropertyRoute = !isAuthenticated
    ? ROUTES.REGISTER
    : user?.role === ROLES.BROKER
      ? ROUTES.ADD_PROPERTY
      : ROUTES.SUBMIT_PROPERTY;

  const buildPropertyUrl = (query, type) => {
    const params = new URLSearchParams();
    if (query) params.set('city', query);
    if (type)  params.set('type', type);
    const qs = params.toString();
    return qs ? `/properties?${qs}` : '/properties';
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    navigate(buildPropertyUrl(searchQuery.trim(), selectedType));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* -- HERO -- */}
      <section className="relative h-screen flex flex-col overflow-hidden bg-slate-900">

        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2071"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>

        {/* ── Inline Navbar ── */}
        <InlineNavbar />

        {/* Central content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-8 md:py-10 text-center">

          {/* Type pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {['Villa', 'Apartment', 'Flat', 'Plot', 'Commercial'].map((cat) => {
              const typeVal = cat.toUpperCase();
              const active = selectedType === typeVal;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    const next = active ? '' : typeVal;
                    setSelectedType(next);
                    navigate(buildPropertyUrl(searchQuery.trim(), next));
                  }}
                  className={`px-6 py-2 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] animate-slide-up">
            Find Nearby<br />
            <span style={{ color: '#E9B38F' }}>Luxurious Estates</span>
          </h1>

          <p className="text-white/60 text-lg max-w-2xl font-medium animate-fade-in-slow">
            Whether buying, renting, or selling — discover thousands of verified properties matched to your lifestyle.
          </p>

          {/* Integrated search bar */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-3xl bg-white/10 backdrop-blur-3xl border border-white/20 p-2 rounded-[40px] shadow-2xl flex items-center"
          >
            <div className="flex flex-1 items-center gap-3 px-5 py-3 border-r border-white/10">
              <MapPin className="shrink-0" size={20} style={{ color: '#E9B38F' }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Location</span>
                <input
                  type="text"
                  placeholder="Where are you looking?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white placeholder-white/30 outline-none font-semibold text-sm w-full"
                />
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 px-5 py-3">
              <Building2 className="shrink-0" size={20} style={{ color: '#E9B38F' }} />
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Property Type</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-transparent text-white outline-none font-semibold text-sm cursor-pointer"
                >
                  <option value="" className="text-slate-900">All Properties</option>
                  <option value="VILLA" className="text-slate-900">Villa</option>
                  <option value="APARTMENT" className="text-slate-900">Apartment</option>
                  <option value="FLAT" className="text-slate-900">Flat</option>
                  <option value="PLOT" className="text-slate-900">Plot</option>
                  <option value="COMMERCIAL" className="text-slate-900">Commercial</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{ backgroundColor: '#E9B38F' }}
              className="px-8 py-4 rounded-[32px] font-black text-slate-900 transition-all hover:brightness-95 active:scale-95 flex items-center gap-2 shrink-0 text-sm"
            >
              <Search size={18} strokeWidth={2.5} /> Search
            </button>
          </form>

          {/* Auth CTAs — only shown when not logged in */}
          {!isAuthenticated && (
            <div className="flex items-center gap-3 mt-2">
              <Link
                to={ROUTES.LOGIN}
                className="px-8 py-3 rounded-full font-bold text-sm text-white border border-white/30 bg-white/10 hover:bg-white/20 transition-all"
              >
                Log In
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="px-8 py-3 rounded-full font-black text-sm text-slate-900 transition-all hover:brightness-95 active:scale-95"
                style={{ backgroundColor: '#E9B38F' }}
              >
                Register Free
              </Link>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 px-8 lg:px-12 pb-7 flex items-center justify-center">

          {/* Intent ticker — non-interactive, auto-cycles */}
          <div className="flex gap-0 p-2 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10">
            {[{ key: 'buy', label: 'Buy' }, { key: 'rent', label: 'Rent' }, { key: 'list', label: 'List' }].map(({ key, label }) => (
              <span
                key={key}
                className={`px-8 py-3 rounded-full font-bold text-sm select-none transition-all duration-500 ${
                  activeTab === key
                    ? 'bg-white/15 text-white scale-105'
                    : 'text-white/35'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -- STATS -- */}
      <section className="bg-white py-16 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="text-center group">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-3xl sm:text-4xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1.5 font-semibold tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- PROPERTY TYPES -- */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 rounded-full uppercase tracking-wider mb-4 border border-slate-300">
              Browse by type
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Explore property types</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PROPERTY_TYPES.map(({ emoji, label, count }) => (
              <button
                key={label}
                onClick={() => navigate('/properties')}
                className="bg-white rounded-2xl p-5 text-center border border-slate-100 hover:border-amber-200 hover:shadow-md hover:shadow-amber-50 transition-all group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{emoji}</div>
                <p className="font-bold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{count}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* -- FEATURES -- */}
      <section className="py-28 px-6 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-dark pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full uppercase tracking-wider mb-5 border border-amber-200">
              <Sparkles size={11} /> Why HaH?
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Everything you need,<br className="hidden sm:block" />
              <span className="text-gradient-gold"> in one platform</span>
            </h2>
            <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
            Built for transparency, speed, and reliability — for buyers, renters, owners, and brokers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, gradient, glow }) => (
              <div key={title} className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-amber-100 card-hover group shadow-sm">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- HOW IT WORKS -- */}
      <section className="py-28 px-6 bg-white relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full uppercase tracking-wider mb-5 border border-amber-200">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Simple. Fast. Reliable.</h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100" />
            {STEPS.map(({ n, title, desc, color }) => (
              <div key={n} className="text-center group">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${color} text-white text-xl font-black flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-200/50 group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-amber-300/40`}>
                  {n}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- TESTIMONIALS -- */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full uppercase tracking-wider mb-5 border border-amber-200">
              <Star size={11} className="fill-current" /> Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Loved by thousands</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, initial }) => (
              <div key={name} className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm card-hover">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- TRUST -- */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-14 text-center sm:text-left">
            {[
              { icon: BadgeCheck, label: 'Verified listings only',   bg: 'bg-emerald-100', color: 'text-emerald-600' },
              { icon: CheckCircle, label: 'No hidden fees',           bg: 'bg-sky-100',     color: 'text-sky-600'     },
              { icon: Shield,     label: 'Secure deal tracking',     bg: 'bg-amber-100',   color: 'text-amber-700'   },
              { icon: Building2,  label: 'Broker-managed portfolio', bg: 'bg-orange-100',  color: 'text-orange-600'  },
            ].map(({ icon: Icon, label, bg, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon size={18} className={color} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="py-28 px-6 relative overflow-hidden text-white text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 blur-3xl rounded-full pointer-events-none" style={{ background: 'rgba(233,179,143,0.15)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 blur-3xl rounded-full pointer-events-none" style={{ background: 'rgba(233,179,143,0.10)' }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-bold mb-6 uppercase tracking-wider" style={{ color: '#E9B38F' }}>
            <Sparkles size={11} style={{ color: '#E9B38F' }} /> Start for free
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">Ready to find<br />your home?</h2>
          <p className="text-white/70 mb-10 text-lg leading-relaxed">
            Join thousands of happy clients who found their perfect property on HaH Real Estate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-amber-50 transition-all duration-200 shadow-xl text-lg group active:scale-95"
              >
                <Search size={16} /> Browse Listings
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-4 font-bold rounded-2xl transition-all duration-200 shadow-xl text-lg group active:scale-95 text-slate-900"
                  style={{ backgroundColor: '#E9B38F' }}
                >
                  Create Free Account
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-white/10 border border-white/25 text-white font-bold rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-base active:scale-95"
                >
                  <Search size={16} /> Browse Listings
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
