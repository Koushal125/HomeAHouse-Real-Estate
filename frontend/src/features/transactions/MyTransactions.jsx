import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getDealStatusLabel, getOfferActionLabel, DEAL_STATUS } from '../../utils/enums';
import { normalizeDeal, parsePage } from '../../utils/normalizers';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { AlertCircle, ArrowRight, Receipt, Filter } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: DEAL_STATUS.PENDING,        label: 'Pending' },
  { value: DEAL_STATUS.UNDER_CONTRACT, label: 'Under Contract' },
  { value: DEAL_STATUS.CLOSED,         label: 'Closed' },
];

const SORT_OPTIONS = [
  { sortBy: 'dealDate',  direction: 'DESC', label: 'Date (Newest)' },
  { sortBy: 'dealDate',  direction: 'ASC',  label: 'Date (Oldest)' },
  { sortBy: 'dealCost',  direction: 'DESC', label: 'Amount (High → Low)' },
  { sortBy: 'dealCost',  direction: 'ASC',  label: 'Amount (Low → High)' },
];

const dealStatusBadgeVariant = {
  PENDING:        'warning',
  UNDER_CONTRACT: 'info',
  CLOSED:         'success',
};

const isRentalType = (offerType) =>
  offerType === 'RENT_LONG_TERM' || offerType === 'RENT_SHORT_TERM';

const MyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState(0); // index into SORT_OPTIONS
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const { sortBy, direction } = SORT_OPTIONS[sortKey];
        const params = new URLSearchParams({ sortBy, direction, page, size: PAGE_SIZE });
        if (statusFilter) params.append('status', statusFilter);

        const response = await api.get(`/deals/me/transactions?${params.toString()}`);
        const pageData = parsePage(response.data);
        setTransactions(pageData.items.map(normalizeDeal));
        setTotalPages(pageData.totalPages);
      } catch (err) {
        console.error('Failed to load transactions:', err);
        setError('Failed to load your transaction history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [statusFilter, sortKey, page]);

  if (isLoading) return <PageSpinner message="Loading your transaction history…" />;

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
      label="History"
      icon={<Receipt size={10} strokeWidth={2.5} />}
      title="My Transactions"
      subtitle="Track properties you have purchased or leased."
      accentHex="#0ea5e9"
    >
      <div className="space-y-8 animate-slide-up">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2">
          <Filter size={13} strokeWidth={2} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2">
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(Number(e.target.value)); setPage(0); }}
            className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200"
          >
            Clear filter
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Receipt size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-500 mb-1">No transactions found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            {statusFilter
              ? `No ${getDealStatusLabel(statusFilter).toLowerCase()} transactions.`
              : 'When you buy or rent a property, it will appear here.'}
          </p>
          {statusFilter ? (
            <button onClick={() => setStatusFilter('')} className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm" style={{ backgroundColor: '#E9B38F' }}>
              Show all transactions
            </button>
          ) : (
            <Link to="/properties" className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm" style={{ backgroundColor: '#E9B38F' }}>
              Browse Properties
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {transactions.map((deal) => (
              <div key={deal.id} className="px-8 py-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 truncate text-sm tracking-tight">{deal.propertyTitle}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ref #{deal.propertyId}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="text-xs text-slate-500">{getOfferActionLabel(deal.offerType)}</span>
                      <span className="font-black text-slate-900 text-sm" style={{ color: '#E9B38F' }}>₹{deal.amount?.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-400">{deal.transactionDate ? new Date(deal.transactionDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                      {isRentalType(deal.offerType) && deal.startDate && deal.endDate && (
                        <span className="text-xs text-slate-400">
                          {new Date(deal.startDate).toLocaleDateString('en-IN')} – {new Date(deal.endDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <Badge variant={dealStatusBadgeVariant[deal.status] ?? 'default'}>
                      {getDealStatusLabel(deal.status)}
                    </Badge>
                    <Link
                      to={`/properties/${deal.propertyId}`}
                      className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      View <ArrowRight size={12} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-5 py-2 text-sm font-bold rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400 font-medium">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="px-5 py-2 text-sm font-bold rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </PageShell>
  );
};
export default MyTransactions;
