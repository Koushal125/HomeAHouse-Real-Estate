import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { CalendarDays, AlertCircle, Building2, Clock } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const statusBadgeVariant = {
  REQUESTED:  'warning',
  CONFIRMED:  'success',
  COMPLETED:  'info',
  CANCELLED:  'default',
};

const statusLabel = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const formatDateTime = (dt) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const MyVisits = () => {
  const { showToast } = useToast();
  const [visits, setVisits]         = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/site-visits/me');
        setVisits(res.data);
      } catch {
        setError('Failed to load your visit requests. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleCancel = async (visitId) => {
    setCancelling(visitId);
    try {
      await api.delete(`/site-visits/${visitId}`);
      setVisits((prev) => prev.map((v) => v.id === visitId ? { ...v, status: 'CANCELLED' } : v));
      showToast('Visit request cancelled.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to cancel visit.', 'error');
    } finally {
      setCancelling(null);
    }
  };

  if (isLoading) return <PageSpinner message="Loading your visits..." />;

  return (
    <PageShell
      label="Calendar"
      icon={<CalendarDays size={10} strokeWidth={2.5} />}
      title="My Visit Requests"
      subtitle="Track all your scheduled property visits."
      accentHex="#8b5cf6"
    >
      <div className="space-y-6 animate-slide-up">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {visits.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={24} strokeWidth={2} className="text-slate-300" />
            </div>
            <p className="text-sm font-black text-slate-500 mb-1">No visit requests yet</p>
            <p className="text-xs text-slate-400 mb-5">Browse properties and schedule a visit from the detail page.</p>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm"
              style={{ backgroundColor: '#E9B38F' }}
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {visits.map((visit) => {
                const canCancel = visit.status === 'REQUESTED' || visit.status === 'CONFIRMED';
                return (
                  <div key={visit.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 size={16} strokeWidth={2} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/properties/${visit.propertyId}`}
                            className="font-black text-slate-900 hover:text-slate-700 text-sm truncate block"
                          >
                            {visit.propertyTitle}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">{visit.propertyCity}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                            <Clock size={11} />
                            {formatDateTime(visit.visitDateTime)}
                          </div>
                          {visit.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{visit.notes}"</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">Broker: {visit.brokerName || '-'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={statusBadgeVariant[visit.status] ?? 'default'}>
                          {statusLabel[visit.status] ?? visit.status}
                        </Badge>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(visit.id)}
                            disabled={cancelling === visit.id}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            {cancelling === visit.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default MyVisits;
