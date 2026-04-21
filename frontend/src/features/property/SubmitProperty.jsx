import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropertyForm from '../../components/property/PropertyForm';
import PageShell from '../../components/layout/PageShell';
import { ROUTES } from '../../utils/constants';

const SubmitProperty = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state?.draft;

  const handleSubmit = async (formData) => {
    setError('');
    navigate(ROUTES.PROPERTY_PREVIEW, {
      state: {
        draft: formData,
        mode: 'customer-submit',
        returnTo: ROUTES.SUBMIT_PROPERTY,
      },
    });
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Property Submitted!</h2>
        <p className="text-slate-400">
          Your property has been successfully submitted to our broker network for review.
        </p>
      </div>
    );
  }

  return (
    <PageShell
      label="Owner"
      title="Submit Your Property"
      subtitle="Provide property details and our brokers will handle the rest."
      accentHex="#E9B38F"
    >
      <div className="max-w-4xl mx-auto">

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Reusing the exact same form the Brokers use! */}
      <PropertyForm initialData={initialData} onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Preview Submission" />
      </div>
    </PageShell>
  );
};

export default SubmitProperty;