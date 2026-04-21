import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropertyForm from '../../components/property/PropertyForm';
import api from '../../services/api';
import { ROUTES } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../utils/errorMessages';
import { PageSpinner } from '../../components/ui/Spinner';
import PageShell from '../../components/layout/PageShell';

const EditProperty = () => {
  const { id } = useParams(); // Get ID from /properties/:id/edit
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProperty = async () => {
      setError('');

      try {
        const response = await api.get(`/properties/${id}`);
        setInitialData(response.data);
      } catch (err) {
        setError('Could not find the property details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleSubmit = async (updatedData, files) => {
    setIsSaving(true);
    setError('');

    try {
      await api.put(`/properties/${id}`, updatedData);

      if (files && files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        await api.post(`/properties/${id}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showToast('Property updated successfully.', 'success');
      navigate(ROUTES.MANAGED_PROPERTIES);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to update property.', 'property');
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner message="Loading property details…" />;

  return (
    <PageShell
      label="Broker Tools"
      title="Edit Property"
      subtitle="Update the details for your listing."
      accentHex="#10b981"
    >
      <div className="max-w-4xl">

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <PropertyForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        isLoading={isSaving}
        showImageUpload
      />
      </div>
    </PageShell>
  );
};

export default EditProperty;