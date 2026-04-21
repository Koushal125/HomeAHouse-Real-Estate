import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/features/authSlice';
import { ROUTES, ROLES } from '../../utils/constants';
import { Building2, ChevronDown, LogOut, User } from 'lucide-react';

/**
 * Inline navbar for pages with their own background.
 * variant="dark"  — white text, glassmorphic pills (default — hero image backgrounds)
 * variant="light" — slate text, solid white pill surface (light-bg dashboards)
 */
const InlineNavbar = ({ variant = 'dark' }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => { dispatch(logout()); navigate(ROUTES.HOME); };

  const dashboardRoute = user?.role === ROLES.BROKER ? ROUTES.BROKER_DASHBOARD : ROUTES.CUSTOMER_DASHBOARD;
  const L = variant === 'light';

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkCls = (path) => {
    const active = isActive(path);
    const base = 'relative px-4 py-1.5 text-sm font-semibold rounded-full transition-all';
    const activeColor = L ? 'text-slate-900' : 'text-white';
    const inactiveColor = L ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/10';
    return `${base} ${active ? activeColor : inactiveColor}`;
  };

  const ActiveDot = ({ path }) => isActive(path) ? (
    <span
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
      style={{ backgroundColor: '#E9B38F' }}
    />
  ) : null;

  const pillCls   = L ? 'hidden md:flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm'
                      : 'hidden md:flex items-center gap-1 bg-white/10 border border-white/20 backdrop-blur-xl px-3 py-1.5 rounded-full';
  const logoIcon  = L ? 'w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md'
                      : 'w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md';
  const logoText  = L ? 'text-slate-900' : 'text-white';
  const authBtnCls = L ? 'flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-all shadow-sm'
                       : 'flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all';
  const loginCls  = L ? 'px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all'
                      : 'px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all';
  const chevClr   = L ? 'text-slate-500' : 'text-white';
  const userNameCls = L ? 'text-sm font-semibold hidden sm:block text-slate-700' : 'text-sm font-semibold hidden sm:block text-white';

  return (
    <div className="flex items-center justify-between px-6 md:px-10 py-4">
      <Link to={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0">
        <div className={logoIcon}>
          <Building2 size={16} className="text-white" />
        </div>
        <span className={'font-black text-lg tracking-tight hidden sm:block ' + logoText}>
          HaH <span style={{ color: '#E9B38F' }}>Estates</span>
        </span>
      </Link>

      <div className={pillCls}>
        <Link to="/properties" className={navLinkCls('/properties')}>
          Explore
          <ActiveDot path="/properties" />
        </Link>
        {isAuthenticated && (
          <Link to={dashboardRoute} className={navLinkCls(dashboardRoute)}>
            My Corner
            <ActiveDot path={dashboardRoute} />
          </Link>
        )}
        <Link to={ROUTES.HOME} className={navLinkCls(ROUTES.HOME)}>
          About
          <ActiveDot path={ROUTES.HOME} />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className={authBtnCls}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user?.name || user?.custName || user?.broName || 'U').trim().slice(0, 1).toUpperCase()}
              </div>
              <span className={userNameCls}>
                {(user?.name || user?.custName || user?.broName || '').split(' ')[0] || 'User'}
              </span>
              <ChevronDown size={13} className={'transition-transform ' + (menuOpen ? 'rotate-180 ' : '') + chevClr} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1 z-50">
                <Link to={dashboardRoute} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                  My Corner
                </Link>
                <div className="px-2 py-1">
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl transition-all duration-200"
                    style={{ backgroundColor: '#E9B38F22', border: '1px solid #E9B38F66' }}
                  >
                    <User size={13} strokeWidth={2.5} style={{ color: '#C27C3E' }} /> My Profile
                  </Link>
                </div>
                <div className="border-t border-slate-100" />
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to={ROUTES.LOGIN} className={loginCls}>Log in</Link>
            <Link to={ROUTES.REGISTER} className="px-4 py-2 text-sm font-bold text-slate-900 rounded-full transition-all" style={{ backgroundColor: '#E9B38F' }}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineNavbar;
