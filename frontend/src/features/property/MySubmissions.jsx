import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { normalizeProperty } from '../../utils/normalizers';
import { formatEnumLabel, getPropertyStatusLabel } from '../../utils/enums';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/common/StatsCard';
import { AlertCircle, Building2, ArrowRight, Send, LayoutList, Clock, CheckCircle, XCircle } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const statusVariant = {
  PENDING:   'warning',
  AVAILABLE: 'success',
  REJECTED:  'error',
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/properties/me/submissions');
        setSubmissions((response.data || []).map(normalizeProperty));
      } catch (err) {
        setError('Failed to load your submissions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const summary = useMemo(() => ({
    total:    submissions.length,
    pending:  submissions.filter((p) => p.status === 'PENDING').length,
    approved: submissions.filter((p) => p.status === 'AVAILABLE').length,
    rejected: submissions.filter((p) => p.status === 'REJECTED').length,
  }), [submissions]);

  if (isLoading) return <PageSpinner message="Loading your submissions…" />;

  const stats = [
    { title: 'Total',    value: summary.total,    color: 'indigo',  icon: <LayoutList size={20} strokeWidth={2} /> },
    { title: 'Pending',  value: summary.pending,  color: 'amber',   icon: <Clock size={20} strokeWidth={2} /> },
    { title: 'Approved', value: summary.approved, color: 'emerald', icon: <CheckCircle size={20} strokeWidth={2} /> },
    { title: 'Rejected', value: summary.rejected, color: 'rose',    icon: <XCircle size={20} strokeWidth={2} /> },
  ];

  return (
    <PageShell
      label="Submissions"
      icon={<Send size={10} strokeWidth={2.5} />}
      title="My Submissions"
      subtitle="Track properties you submitted for broker review."
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.title} title={s.title} value={s.value} color={s.color} icon={s.icon} />
          ))}
        </div>
      )}

      {!error && submissions.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Send size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-500 mb-1">No submissions yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">Submit a property and it will appear here.</p>
          <Link
            to="/submit-property"
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm"
            style={{ backgroundColor: '#E9B38F' }}
          >
            Submit Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {submissions.map((property) => (
            <div key={property.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="h-44 bg-slate-100 relative overflow-hidden" style={{ borderRadius: '40px 40px 0 0' }}>
                {property.imageUrl ? (
                  <img src={property.imageUrl} alt={property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={32} strokeWidth={1.5} className="text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={statusVariant[property.status] ?? 'default'}>
                    {getPropertyStatusLabel(property.status)}
                  </Badge>
                </div>
              </div>
              <div className="p-5 space-y-2 flex-grow">
                <h3 className="font-black text-slate-900 truncate tracking-tight">{property.title}</h3>
                <p className="font-black text-sm" style={{ color: '#E9B38F' }}>
                  ₹{property.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold truncate">
                  {property.locality || property.city}
                </p>
                <p className="text-xs text-slate-400">
                  {formatEnumLabel(property.propertyType)} · {property.bedrooms} Beds · {property.bathrooms} Baths
                </p>

                {property.status === 'REJECTED' && Array.isArray(property.rejectionHistory) && property.rejectionHistory.length > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 space-y-2 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Rejection Details</p>
                    {property.rejectionHistory.map((entry, idx) => (
                      <div key={idx} className="border-t border-red-100 pt-2 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-black text-red-800">{entry.brokerName}</span>
                          <span className="text-xs text-red-500">{formatDateTime(entry.rejectedAt)}</span>
                        </div>
                        <p className="text-xs text-red-700 leading-relaxed">{entry.reason || 'No reason provided.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 pb-5">
                <Link
                  to={`/properties/${property.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View Details <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </PageShell>
  );
};

export default MySubmissions;
