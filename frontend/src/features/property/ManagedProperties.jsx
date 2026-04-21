import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ROUTES } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { formatEnumLabel, getPropertyStatusLabel } from '../../utils/enums';
import { normalizeProperty } from '../../utils/normalizers';
import { getApiErrorMessage } from '../../utils/errorMessages';
import { PageSpinner } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Building2, AlertCircle, Plus, Edit2, Trash2, Trash } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const statusVariant = {
  AVAILABLE: 'success',
  PENDING:   'warning',
  SOLD:      'default',
  RENTED:    'info',
};

const ManagedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchManagedProperties();
  }, []);

  const fetchManagedProperties = async () => {
    try {
      const [activeRes, deletedRes] = await Promise.all([
        api.get('/properties/me/managed'),
        api.get('/properties/me/deleted'),
      ]);
      const active = activeRes.data.content || activeRes.data.data || activeRes.data || [];
      const deleted = deletedRes.data.content || deletedRes.data.data || deletedRes.data || [];
      setProperties(active.map(normalizeProperty));
      setDeletedProperties(deleted.map(normalizeProperty));
    } catch (err) {
      setError('Failed to load your properties. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (propertyId) => {
    setConfirmDeleteId(propertyId);
  };

  const handleConfirmDelete = async () => {
    const propertyId = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(propertyId);
    try {
      await api.delete(`/properties/${propertyId}`);
      setProperties(properties.filter(p => p.id !== propertyId));
      showToast('Property deleted successfully.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete property. It might be tied to an active transaction.', 'property'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <PageSpinner message="Loading your inventory…" />;

  const addBtn = (
    <Link
      to={ROUTES.ADD_PROPERTY}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-slate-900 text-sm font-black rounded-full"
      style={{ backgroundColor: '#E9B38F' }}
    >
      <Plus size={14} strokeWidth={2.5} /> Add Property
    </Link>
  );

  return (
    <PageShell
      label="Listings"
      icon={<Building2 size={10} strokeWidth={2.5} />}
      title="Managed Properties"
      subtitle="View and manage your active real estate listings."
      accentHex="#E9B38F"
      actions={addBtn}
    >
      <div className="space-y-8 animate-slide-up">

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {properties.length === 0 && !error ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-500 mb-1">No properties listed yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">Get started by creating your first listing.</p>
          <Link
            to={ROUTES.ADD_PROPERTY}
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm"
            style={{ backgroundColor: '#E9B38F' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add a Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-44 bg-slate-100 relative overflow-hidden" style={{ borderRadius: '40px 40px 0 0' }}>
                {property.imageUrl ? (
                  <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={32} strokeWidth={1.5} className="text-slate-300" />
                  </div>
                )}
                {deletingId === property.id && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={statusVariant[property.status] ?? 'default'}>
                    {getPropertyStatusLabel(property.status || 'AVAILABLE')}
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex-grow">
                <h3 className="font-black text-slate-900 truncate tracking-tight">{property.title}</h3>
                <p className="font-black text-sm mt-1" style={{ color: '#E9B38F' }}>
                  ₹{property.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold truncate">
                  {property.locality || property.city} · {formatEnumLabel(property.propertyType)}
                </p>
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <Link
                  to={`/properties/${property.id}/edit`}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors ${
                    deletingId === property.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Edit2 size={12} strokeWidth={2.5} /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(property.id)}
                  disabled={deletingId === property.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} strokeWidth={2.5} />
                  {deletingId === property.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deletedProperties.length > 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-2">
            <Trash size={14} strokeWidth={2} className="text-slate-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deleted Listings</p>
          </div>
          <div className="divide-y divide-slate-50">
            {deletedProperties.map((p) => (
              <div key={p.id} className="px-8 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400 line-through truncate">{p.title}</p>
                <div className="flex items-center gap-6 shrink-0 text-xs text-slate-400">
                  <span>{p.area?.toLocaleString()} sqft</span>
                  <span>₹{p.price?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={20} strokeWidth={2} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Delete Property</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 text-sm font-black text-white rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
};

export default ManagedProperties;
