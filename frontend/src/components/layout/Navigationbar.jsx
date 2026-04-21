import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/features/authSlice';
import { ROUTES, ROLES } from '../../utils/constants';
import {
  Building2, ChevronDown, LayoutDashboard, LogOut,
  Menu, Search, User, X,
  CalendarCheck, CalendarDays, Calculator, ClipboardList,
  FileText, GitMerge, Home, PlusSquare, Receipt, Bookmark, BarChart2,
} from 'lucide-react';

const customerLinks = [
  { name: 'Dashboard',       path: ROUTES.CUSTOMER_DASHBOARD, icon: LayoutDashboard },
  { name: 'My Properties',   path: ROUTES.MY_PROPERTIES,      icon: Home            },
  { name: 'My Transactions', path: ROUTES.MY_TRANSACTIONS,    icon: Receipt         },
  { name: 'Submit Property', path: ROUTES.SUBMIT_PROPERTY,    icon: PlusSquare      },
  { name: 'My Submissions',  path: ROUTES.MY_SUBMISSIONS,     icon: FileText        },
  { name: 'Saved Listings',  path: ROUTES.SAVED_LISTINGS,     icon: Bookmark        },
  { name: 'My Visits',       path: ROUTES.MY_VISITS,          icon: CalendarDays    },
  { name: 'EMI Calculator',  path: ROUTES.EMI_CALCULATOR,     icon: Calculator      },
];

const brokerLinks = [
  { name: 'Dashboard',         path: ROUTES.BROKER_DASHBOARD,      icon: LayoutDashboard },
  { name: 'Deal Pipeline',     path: '/pipeline',                  icon: GitMerge        },
  { name: 'My Listings',       path: ROUTES.MANAGED_PROPERTIES,    icon: Building2       },
  { name: 'Add Property',      path: ROUTES.ADD_PROPERTY,          icon: PlusSquare      },
  { name: 'Owner Submissions', path: ROUTES.OWNER_SUBMISSIONS,     icon: ClipboardList   },
  { name: 'Visit Requests',    path: ROUTES.BROKER_VISIT_REQUESTS, icon: CalendarCheck   },
  { name: 'Analytics',         path: '/broker/analytics',          icon: BarChart2       },
  { name: 'EMI Calculator',    path: ROUTES.EMI_CALCULATOR,        icon: Calculator      },
];

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.HOME);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/properties');
    }
  };

  const dashboardLink = user?.role === ROLES.BROKER ? ROUTES.BROKER_DASHBOARD : ROUTES.CUSTOMER_DASHBOARD;
  const navLinks  = user?.role === ROLES.BROKER ? brokerLinks : customerLinks;
  const roleLabel = user?.role === ROLES.BROKER ? 'Broker' : 'Customer';

  const displayName = (
    user?.name || user?.custName || user?.broName ||
    (user?.email ? user.email.split('@')[0] : '')
  ).trim();

  const initials = (displayName || 'User')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const logoTarget = isAuthenticated ? dashboardLink : ROUTES.HOME;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-200/60 border-b border-slate-200/80'
          : 'bg-white/90 backdrop-blur-sm border-b border-slate-100'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="relative flex h-16 items-center">

          {/* Logo — left */}
          <Link to={logoTarget} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200 group-hover:shadow-amber-300 transition-all duration-200">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight hidden sm:block">
              HaH <span className="text-gradient">Estates</span>
            </span>
          </Link>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm"
          >
            <div className="relative w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, area, city…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all"
                style={{ '--tw-ring-color': '#E9B38F' }}
              />
            </div>
          </form>

          {/* Right: nav links + profile */}
          <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
            <Link
              to="/properties"
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                isActive('/properties')
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Explore
            </Link>
            {isAuthenticated && (
              <Link
                to={dashboardLink}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isActive(dashboardLink)
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Corner
              </Link>
            )}

            <div className="w-px h-5 bg-slate-200 mx-1" />
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition-all duration-200"
                  title={displayName || 'User'}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 text-xs font-black shadow-sm" style={{ backgroundColor: '#E9B38F' }}>
                    {initials}
                  </div>
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-[28px] shadow-2xl border border-slate-100 py-2 animate-scale-in z-50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-sm font-black text-slate-900 truncate tracking-tight">{displayName || 'User'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#E9B38F' }}>{user?.role?.toLowerCase()} Account</p>
                    </div>
                    <div className="px-2 py-2 border-b border-slate-100 max-h-72 overflow-y-auto">
                      <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roleLabel} Menu</p>
                      {navLinks.map(({ name, path, icon: Icon }) => (
                        <Link
                          key={name}
                          to={path}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-colors"
                        >
                          <Icon size={13} strokeWidth={2} className="text-slate-400 shrink-0" />
                          {name}
                        </Link>
                      ))}
                    </div>
                    <div className="px-3 py-2">
                      <Link
                        to={ROUTES.PROFILE}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-slate-900 rounded-2xl transition-all duration-200 active:scale-[0.98]"
                        style={{ backgroundColor: '#E9B38F22', border: '1px solid #E9B38F66' }}
                      >
                        <User size={14} strokeWidth={2.5} style={{ color: '#C27C3E' }} /> My Profile
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 mx-3" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} strokeWidth={2} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
                >
                  Log in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="px-5 py-2 text-sm font-bold text-slate-900 rounded-full shadow-sm transition-all duration-200 active:scale-95"
                  style={{ backgroundColor: '#E9B38F' }}
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1 animate-slide-up">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="px-2 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, area, city…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </form>

            <MobileNavItem to="/properties">Explore</MobileNavItem>
            {isAuthenticated && <MobileNavItem to={dashboardLink}>My Corner</MobileNavItem>}
            <MobileNavItem to={ROUTES.HOME}>About</MobileNavItem>

            {isAuthenticated ? (
              <>
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roleLabel} Menu</p>
                </div>
                {navLinks.map(({ name, path, icon: Icon }) => (
                  <Link
                    key={name}
                    to={path}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl transition-colors"
                  >
                    <Icon size={13} className="text-slate-400 shrink-0" />
                    {name}
                  </Link>
                ))}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <MobileNavItem to={ROUTES.PROFILE}>Profile Settings</MobileNavItem>
                  <p className="px-4 pb-1 text-xs text-slate-400">Signed in as <strong>{displayName || 'User'}</strong></p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 pt-2 px-1">
                <Link
                  to={ROUTES.LOGIN}
                  className="flex-1 text-center text-sm font-semibold py-2.5 border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="flex-1 text-center text-sm font-bold py-2.5 text-slate-900 rounded-full shadow-sm transition-opacity"
                  style={{ backgroundColor: '#E9B38F' }}
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const MobileNavItem = ({ to, children }) => (
  <Link
    to={to}
    className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-colors"
  >
    {children}
  </Link>
);

export default Navbar;