import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ROUTES } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/errorMessages';
import PropertyPreviewContent from '../../components/property/PropertyPreviewContent';

const PreviewSection = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
    {children}
  </div>
);

const PropertyPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draft = location.state?.draft;
  const mode = location.state?.mode;
  const returnTo = location.state?.returnTo;

  if (!draft || !returnTo || !mode) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const handleEdit = () => {
    navigate(returnTo, { state: { draft } });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      if (mode === 'broker-create') {
        await api.post('/properties', draft);
        showToast('Property created successfully.', 'success');
        navigate(ROUTES.MANAGED_PROPERTIES);
      } else {
        await api.post('/properties/submit', draft);
        showToast('Property submitted successfully.', 'success');
        navigate(ROUTES.CUSTOMER_DASHBOARD);
      }
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          mode === 'broker-create'
            ? 'Failed to create property. Please review the listing.'
            : 'Failed to submit property. Please review the listing.',
          'property'
        ),
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Listing Preview</p>
          <h1 className="text-3xl font-bold text-gray-900">Review Before Publishing</h1>
          <p className="mt-1 text-gray-500">This is how the property will appear when listed.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Listing
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Publishing...' : mode === 'broker-create' ? 'Publish Property' : 'Submit For Review'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <PropertyPreviewContent draft={draft} />
        </div>

        <div className="space-y-6">
          <PreviewSection title="Publish Actions">
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : mode === 'broker-create' ? 'Confirm & Publish' : 'Confirm & Submit'}
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Edit Information
              </button>
              <Link to={returnTo} className="block text-center text-sm text-blue-600 hover:underline">
                Back to form
              </Link>
            </div>
          </PreviewSection>
        </div>
      </div>
    </div>
  );
};

export default PropertyPreview;