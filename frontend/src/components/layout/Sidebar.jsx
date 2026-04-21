import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES, ROLES } from '../../utils/constants';
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Calculator,
  ClipboardList,
  FileText,
  GitMerge,
  Home,
  LayoutDashboard,
  PlusSquare,
  Receipt,
  User,
  Bookmark,
  BarChart2,
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
  { name: 'Profile',         path: ROUTES.PROFILE,            icon: User            },
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
  { name: 'Profile',           path: ROUTES.PROFILE,               icon: User            },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user } = useSelector((s) => s.auth);
  const navLinks  = user?.role === ROLES.BROKER ? brokerLinks : customerLinks;
  const roleLabel = user?.role === ROLES.BROKER ? 'Broker' : 'Customer';
  const initials  = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const sidebarContent = (
    <aside className="w-64 flex flex-col h-full bg-slate-900">
      {/* User header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-slate-900 text-sm font-black shadow-lg" style={{ backgroundColor: '#E9B38F' }}>
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate leading-tight tracking-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Navigation</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navLinks.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 group/link ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: '#E9B38F' } : {}}
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-slate-900/20'
                    : 'bg-white/5 group-hover/link:bg-white/10'
                }`}>
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span className="truncate">{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-white/5">
        <div className="flex items-center gap-2 justify-center">
          <Building2 size={12} className="text-slate-600" strokeWidth={2} />
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">HaH Estates © 2026</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex min-h-[calc(100vh-64px)] shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={onClose}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 md:hidden animate-slide-in-left">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
