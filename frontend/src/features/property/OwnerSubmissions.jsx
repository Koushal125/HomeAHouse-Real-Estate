import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatEnumLabel, getPropertyStatusLabel } from '../../utils/enums';
import { normalizeProperty, parsePage } from '../../utils/normalizers';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../utils/errorMessages';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { AlertCircle, Building2, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const OwnerSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, propertyId: null, reason: '' });
  const { showToast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setError('');

    try {
      const response = await api.get('/properties/pending');
      setSubmissions(parsePage(response.data).items.map(normalizeProperty));
    } catch (err) {
      setError('Failed to load submissions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (propertyId, newStatus) => {
    if (newStatus === 'REJECTED') {
      setRejectModal({ open: true, propertyId, reason: '' });
      return;
    }

    setActioningId(propertyId);
    try {
      await api.put(`/properties/${propertyId}/status`, { status: newStatus });
      setSubmissions(submissions.filter(p => p.id !== propertyId));
      showToast(`Submission ${newStatus.toLowerCase()} successfully.`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, `Failed to ${newStatus.toLowerCase()} the property. Please try again.`, 'property'), 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleConfirmReject = async () => {
    const { propertyId, reason } = rejectModal;
    if (!reason.trim()) return;
    setRejectModal({ open: false, propertyId: null, reason: '' });
    setActioningId(propertyId);
    try {
      await api.put(`/properties/${propertyId}/status`, { status: 'REJECTED', reason });
      setSubmissions(submissions.filter(p => p.id !== propertyId));
      showToast('Submission rejected successfully.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to reject the property. Please try again.', 'property'), 'error');
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) return <PageSpinner message="Loading pending submissions…" />;

  return (
    <PageShell
      label="Broker"
      icon={<Inbox size={10} strokeWidth={2.5} />}
      title="Owner Submissions"
      subtitle="Review and approve properties submitted by customers."
      accentHex="#E9B38F"
    >
      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {submissions.length === 0 && !error ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-500 mb-1">Inbox Zero!</h3>
          <p className="text-xs text-slate-400 mt-1">You are all caught up on property reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {submissions.map((property) => (
            <div key={property.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-grow space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 size={16} strokeWidth={2} className="text-slate-400" />
                  </div>
                  <Badge variant="warning">
                    {getPropertyStatusLabel(property.status || 'PENDING')}
                  </Badge>
                </div>
                <h3 className="font-black text-slate-900 truncate tracking-tight">{property.title}</h3>
                <p className="font-black text-sm" style={{ color: '#E9B38F' }}>\u20b9{property.price?.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold truncate">
                  {property.locality || property.city} · {formatEnumLabel(property.propertyType)}
                </p>
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1 text-xs text-slate-500">
                  <p><span className="font-bold text-slate-700">Config:</span> {property.configuration || 'Not provided'}</p>
                  <p><span className="font-bold text-slate-700">Address:</span> {property.address}{property.city ? `, ${property.city}` : ''}</p>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(property.id, 'APPROVED')}
                  disabled={actioningId === property.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  {actioningId === property.id ? 'Working…' : 'Approve'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(property.id, 'REJECTED')}
                  disabled={actioningId === property.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={12} strokeWidth={2.5} />
                  {actioningId === property.id ? 'Working…' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <XCircle size={20} strokeWidth={2} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Reject Submission</h3>
            <p className="text-sm text-slate-400 mb-4">Please provide a reason for the owner.</p>
            <textarea
              className="w-full border border-slate-200 rounded-2xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-200"
              rows={4}
              placeholder="e.g. Incomplete documentation, wrong locality…"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ open: false, propertyId: null, reason: '' })}
                className="flex-1 py-2.5 text-sm font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectModal.reason.trim()}
                className="flex-1 py-2.5 text-sm font-black text-white rounded-full bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
//               </button>
//               <button
//                 onClick={handleConfirmReject}
//                 disabled={!rejectModal.reason.trim()}
//                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Confirm Reject
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
};

export default OwnerSubmissions;