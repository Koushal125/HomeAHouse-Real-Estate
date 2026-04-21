import { useState, useEffect } from 'react';
import api from '../../services/api';
import { getOfferTypeLabel, getDealStatusLabel } from '../../utils/enums';
import { normalizeDeal, parsePage } from '../../utils/normalizers';
import { useToast } from '../../hooks/useToast';
import { PageSpinner } from '../../components/ui/Spinner';
import { AlertCircle, CalendarDays, TrendingUp, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const isRentalType = (offerType) =>
  offerType === 'RENT_LONG_TERM' || offerType === 'RENT_SHORT_TERM';

const DealPipeline = () => {
  const [deals, setDeals] = useState({
    pending: [],
    underContract: [],
    closed: [],
    rejected: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancingId, setAdvancingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/deals/me/pipeline?size=100'); 
        const allDeals = parsePage(response.data).items.map(normalizeDeal);
        
        setDeals({
          pending:       allDeals.filter(d => d.status === 'PENDING'),
          underContract: allDeals.filter(d => d.status === 'UNDER_CONTRACT'),
          closed:        allDeals.filter(d => d.status === 'CLOSED' || !d.status),
          rejected:      allDeals.filter(d => d.status === 'REJECTED'),
        });
      } catch (err) {
        console.error('Failed to load deals:', err);
        setError('Failed to load your deal pipeline. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const NEXT_STATUS = {
    PENDING: 'UNDER_CONTRACT',
    UNDER_CONTRACT: 'CLOSED',
  };

  const ADVANCE_LABEL = {
    PENDING: 'Move to Under Contract',
    UNDER_CONTRACT: 'Mark as Closed',
  };

  const handleAdvance = async (deal) => {
    if (advancingId === deal.id) return;
    setAdvancingId(deal.id);
    try {
      const { data } = await api.patch(`/deals/${deal.id}/advance`);
      const updated = normalizeDeal(data);
      setDeals(prev => {
        const removeFrom = (arr) => arr.filter(d => d.id !== deal.id);
        return {
          pending:       updated.status === 'PENDING'        ? [...prev.pending, updated]        : removeFrom(prev.pending),
          underContract: updated.status === 'UNDER_CONTRACT' ? [...prev.underContract, updated]  : removeFrom(prev.underContract),
          closed:        updated.status === 'CLOSED'         ? [...prev.closed, updated]          : removeFrom(prev.closed),
          rejected:      prev.rejected,
        };
      });
      showToast(`Deal moved to ${updated.status.replace('_', ' ').toLowerCase()}.`, 'success');
    } catch {
      showToast('Failed to advance deal. Please try again.', 'error');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleReject = async (deal) => {
    if (rejectingId === deal.id) return;
    setRejectingId(deal.id);
    try {
      const { data } = await api.patch(`/deals/${deal.id}/reject`);
      const updated = normalizeDeal(data);
      setDeals(prev => ({
        ...prev,
        pending:  prev.pending.filter(d => d.id !== deal.id),
        rejected: [...prev.rejected, updated],
      }));
      showToast('Deal rejected. Property is now available again.', 'success');
    } catch {
      showToast('Failed to reject deal. Please try again.', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const Column = ({ title, sublabel, icon: Icon, items, showAdvance, showReject }) => (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6 min-h-[460px] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon size={14} strokeWidth={2} className="text-slate-500" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm tracking-tight">{title}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sublabel}</p>
          </div>
        </div>
        <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 flex-1">
        {items.map(deal => (
          <div key={deal.id} className="bg-slate-50 rounded-[24px] p-4 hover:bg-slate-100 transition-colors">
            <p className="font-black text-slate-900 truncate text-sm tracking-tight">{deal.propertyTitle}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{deal.customerName}</p>
            {isRentalType(deal.offerType) && deal.startDate && deal.endDate && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                <CalendarDays size={11} strokeWidth={2} />
                {new Date(deal.startDate).toLocaleDateString('en-IN')} – {new Date(deal.endDate).toLocaleDateString('en-IN')}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {getOfferTypeLabel(deal.offerType)}
              </span>
              <span className="font-black text-sm" style={{ color: '#E9B38F' }}>
                ₹{deal.amount?.toLocaleString('en-IN')}
              </span>
            </div>
            {(showAdvance || showReject) && NEXT_STATUS[deal.status] && (
              <div className="mt-3 flex gap-2">
                {showAdvance && (
                  <button
                    onClick={() => handleAdvance(deal)}
                    disabled={advancingId === deal.id || rejectingId === deal.id}
                    className="flex-1 py-1.5 text-xs font-black rounded-full border border-slate-200 text-slate-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {advancingId === deal.id ? 'Updating…' : ADVANCE_LABEL[deal.status]}
                  </button>
                )}
                {showReject && deal.status === 'PENDING' && (
                  <button
                    onClick={() => handleReject(deal)}
                    disabled={rejectingId === deal.id || advancingId === deal.id}
                    className="py-1.5 px-3 text-xs font-black rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejectingId === deal.id ? 'Rejecting…' : 'Reject'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <ArrowRight size={14} strokeWidth={2} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-300">No deals here</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) return <PageSpinner message="Loading your pipeline…" />;

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm mt-6">
        <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <PageShell
      label="Pipeline"
      icon={<TrendingUp size={10} strokeWidth={2.5} />}
      title="Deal Pipeline"
      subtitle="Track and manage your active real estate transactions."
      accentHex="#0ea5e9"
    >
      <div className="space-y-8 animate-slide-up">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Column title="New Offers"     sublabel="Awaiting action" icon={TrendingUp}    items={deals.pending}       showAdvance showReject />
        <Column title="Under Contract" sublabel="In progress"     icon={CalendarDays}  items={deals.underContract} showAdvance />
        <Column title="Closed Won"     sublabel="Completed"       icon={CheckCircle2}  items={deals.closed} />
        <Column title="Rejected"       sublabel="Declined"        icon={XCircle}       items={deals.rejected} />
      </div>
      </div>
    </PageShell>
  );
};
export default DealPipeline;
