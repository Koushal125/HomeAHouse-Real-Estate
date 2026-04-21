import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navigationbar';
import { ROUTES } from '../../utils/constants';
import { Building2, Globe, MessageCircle, Share2, ArrowUpRight } from 'lucide-react';

const FooterLink = ({ to, children }) => (
  <Link to={to} className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">
    {children}
    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </Link>
);

const PublicLayout = () => {
  const location = useLocation();
  const hideNavbar = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!hideNavbar && <Navbar />}

      <main className="flex-grow">
        <Outlet />
      </main>

      {!hideNavbar && (
        <footer className="bg-slate-950 text-slate-400 pt-16 pb-8">
          <div className="max-w-6xl mx-auto px-6">
            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/30">
                    <Building2 size={16} className="text-white" />
                  </div>
                  <span className="font-black text-white text-lg tracking-tight">HaH <span style={{color:'#E9B38F'}}>Estates</span></span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  India's trusted real estate platform for buyers, renters, and property owners.
                </p>
                <div className="flex items-center gap-3 mt-5">
                  {[Globe, MessageCircle, Share2].map((Icon, i) => (
                    <button key={i} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-white transition-all duration-200">
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600 mb-4">Platform</p>
                <div className="space-y-2.5">
                  <FooterLink to="/properties">Browse Listings</FooterLink>
                  <FooterLink to={ROUTES.LOGIN}>Sign In</FooterLink>
                  <FooterLink to={ROUTES.REGISTER}>Create Account</FooterLink>
                </div>
              </div>

              {/* Company */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600 mb-4">Company</p>
                <div className="space-y-2.5">
                  <span className="text-slate-500 text-sm block">About Us</span>
                  <span className="text-slate-500 text-sm block">Contact</span>
                  <span className="text-slate-500 text-sm block">Privacy Policy</span>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
              <p className="text-xs text-slate-600">© 2026 HaH Real Estate Pvt. Ltd. All rights reserved.</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                <p className="text-xs text-slate-600">All systems operational</p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PublicLayout;
