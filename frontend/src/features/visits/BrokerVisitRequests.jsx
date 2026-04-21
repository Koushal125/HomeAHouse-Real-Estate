import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { CalendarCheck, AlertCircle, Building2, Clock, User } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const STATUS_TABS = ['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const statusBadgeVariant = {
  REQUESTED: 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'info',
  CANCELLED: 'default',
};

const statusLabel = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const formatDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const BrokerVisitRequests = () => {
  const { showToast } = useToast();
  const [visits, setVisits]         = useState([]);
  const [activeTab, setActiveTab]   = useState('ALL');
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [actionPending, setActionPending] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/site-visits/broker/requests');
        setVisits(res.data);
      } catch {
        setError('Failed to load visit requests. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const updateStatus = async (visitId, status) => {
    setActionPending(visitId + status);
    try {
      const res = await api.patch(`/site-visits/${visitId}/status`, { status });
      setVisits((prev) => prev.map((v) => v.id === visitId ? res.data : v));
      showToast(`Visit ${statusLabel[status].toLowerCase()} successfully.`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Action failed. Please try again.', 'error');
    } finally {
      setActionPending(null);
    }
  };

  const filtered = activeTab === 'ALL' ? visits : visits.filter((v) => v.status === activeTab);

  if (isLoading) return <PageSpinner message="Loading visit requests…" />;

  return (
    <PageShell
      label="Broker"
      icon={<CalendarCheck size={10} strokeWidth={2.5} />}
      title="Visit Requests"
      subtitle="Manage all scheduled property visits from your customers."
      accentHex="#8b5cf6"
    >
      <div className="space-y-6 animate-slide-up">

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab === 'ALL' ? visits.length : visits.filter((v) => v.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL' ? 'All' : statusLabel[tab]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <p className="text-sm font-black text-slate-500">No visits in this category</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((visit) => (
              <div key={visit.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 size={16} strokeWidth={2} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/properties/${visit.propertyId}`}
                          className="font-black text-slate-900 hover:text-slate-700 text-sm block truncate"
                      >
                        {visit.propertyTitle}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{visit.propertyCity}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User size={11} /> {visit.customerName}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} /> {formatDateTime(visit.visitDateTime)}
                        </span>
                      </div>
                      {visit.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{visit.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={statusBadgeVariant[visit.status] ?? 'default'}>
                      {statusLabel[visit.status] ?? visit.status}
                    </Badge>

                    <div className="flex flex-col gap-1">
                      {visit.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => updateStatus(visit.id, 'CONFIRMED')}
                            disabled={actionPending !== null}
                            className="text-xs font-black px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            {actionPending === visit.id + 'CONFIRMED' ? 'Confirming…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => updateStatus(visit.id, 'CANCELLED')}
                            disabled={actionPending !== null}
                            className="text-xs font-black px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionPending === visit.id + 'CANCELLED' ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </>
                      )}
                      {visit.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => updateStatus(visit.id, 'COMPLETED')}
                            disabled={actionPending !== null}
                            className="text-xs font-black px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            {actionPending === visit.id + 'COMPLETED' ? 'Updating…' : 'Mark Complete'}
                          </button>
                          <button
                            onClick={() => updateStatus(visit.id, 'CANCELLED')}
                            disabled={actionPending !== null}
                            className="text-xs font-black px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionPending === visit.id + 'CANCELLED' ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
};

export default BrokerVisitRequests;
