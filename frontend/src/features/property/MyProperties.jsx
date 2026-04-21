import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ROUTES } from '../../utils/constants';
import { formatEnumLabel, getPropertyStatusLabel } from '../../utils/enums';
import { normalizeUserProfile } from '../../utils/normalizers';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/common/StatsCard';
import PageShell from '../../components/layout/PageShell';
import { AlertCircle, Building2, ArrowRight, Home, Receipt } from 'lucide-react';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOwnedProperties = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await api.get('/users/me');
        const profile = normalizeUserProfile(response.data);
        setProperties(profile.properties || []);
      } catch (err) {
        setError('Failed to load your properties. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedProperties();
  }, []);

  const summary = useMemo(() => {
    const total = properties.length;
    const sold = properties.filter((property) => property.status === 'SOLD').length;
    const rented = properties.filter((property) => property.status === 'RENTED').length;

    return { rented, sold, total };
  }, [properties]);

  if (isLoading) return <PageSpinner message="Loading your properties…" />;

  return (
    <PageShell
      label="Portfolio"
      icon={<Home size={10} strokeWidth={2.5} />}
      title="My Properties"
      subtitle="Properties currently owned by your account."
      accentHex="#E9B38F"
    >
      <div className="space-y-8 animate-slide-up">

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard title="Total Owned" value={String(summary.total)} icon={<Home size={20} strokeWidth={2} />} color="amber" />
          <StatsCard title="Purchased" value={String(summary.sold)} icon={<Building2 size={20} strokeWidth={2} />} color="emerald" />
          <StatsCard title="Active Rentals" value={String(summary.rented)} icon={<Receipt size={20} strokeWidth={2} />} color="sky" />
        </div>
      )}

      {!error && properties.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Home size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <p className="text-sm font-black text-slate-500 mb-1">You do not own any properties yet.</p>
          <p className="text-xs text-slate-400 mt-1 mb-6">Browse available listings and complete a transaction.</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm"
            style={{ backgroundColor: '#E9B38F' }}
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="flex h-48 items-center justify-center bg-slate-50 rounded-t-[40px] overflow-hidden">
                {property.imageUrl ? (
                  <img src={property.imageUrl} alt={property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Building2 size={20} strokeWidth={2} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-slate-900 truncate tracking-tight">{property.title}</h3>
                  <Badge variant="default">{getPropertyStatusLabel(property.status)}</Badge>
                </div>
                <p className="font-black text-slate-900 text-xl tracking-tighter">₹{property.price?.toLocaleString('en-IN')}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{property.locality || property.city}</p>
                <p className="text-xs text-slate-400">
                  {formatEnumLabel(property.propertyType)} · {property.bedrooms} Beds · {property.bathrooms} Baths
                </p>
                <Link
                  to={`/properties/${property.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-sm font-semibold transition-colors"
                >
                  View Details <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Link to={ROUTES.MY_TRANSACTIONS} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          View My Transactions <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
    </PageShell>
  );
};

export default MyProperties;
