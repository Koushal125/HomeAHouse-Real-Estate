import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropertyForm from '../../components/property/PropertyForm';
import PropertyPreviewContent from '../../components/property/PropertyPreviewContent';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ROUTES } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/errorMessages';
import PageShell from '../../components/layout/PageShell';

const AddProperty = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state?.draft;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDraft, setPreviewDraft] = useState(initialData ?? null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (formData, files) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/properties', formData);
      const propertyId = response.data.propId;

      if (files && files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        await api.post(`/properties/${propertyId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showToast('Property created successfully.', 'success');
      navigate(ROUTES.MANAGED_PROPERTIES);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create property. Please review the listing.', 'property');
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewChange = useCallback((formValues) => {
    setPreviewDraft(formValues);
  }, []);

  return (
    <PageShell
      label="Broker Tools"
      title="Add New Property"
      subtitle="List a new property on the market. Fill out the form below."
      accentHex="#10b981"
    >
      <div className="max-w-7xl mx-auto">

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0">
          <PropertyForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            submitLabel="Publish Property"
            onValuesChange={handlePreviewChange}
            showImageUpload
          />
        </div>

        <aside className="self-start xl:sticky xl:top-6">
          <div className="mb-4 rounded-[28px] border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Live Preview Panel</p>
            <h2 className="mt-2 text-xl font-semibold">Listing updates as you type</h2>
            <p className="mt-1 text-sm text-slate-300">
              Verify the address, pricing, and nearby amenities before publishing the property.
            </p>
          </div>

          <PropertyPreviewContent draft={previewDraft} variant="panel" />
        </aside>
      </div>
    </div>
    </PageShell>
  );
};

export default AddProperty;