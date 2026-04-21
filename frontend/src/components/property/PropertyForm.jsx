import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PROPERTY_TYPE, OFFER_TYPE, AREA_UNIT, formatEnumLabel, getAreaUnitLabel } from '../../utils/enums';
import ProximityAmenities from './ProximityAmenities';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const MAX_FILES = 10;

const REQUIRED_AMENITY_TYPES = ['HOSPITAL', 'SCHOOL', 'POLICE_STATION'];

const schema = yup.object({
  title: yup.string().trim().required('Property name is required.').max(100, 'Property name should not exceed 100 characters.'),
  propertyType: yup.string().oneOf(Object.values(PROPERTY_TYPE), 'Please select a valid property type.').required('Property type is required.'),
  offerType: yup.string().oneOf(Object.values(OFFER_TYPE), 'Please select a valid offer type.').required('Offer type is required.'),
  configuration: yup.string().trim().required('Property configuration is required.'),
  offerCost: yup.number().typeError('Offer price should be a valid number.').min(1, 'Offer price should be greater than 0.').required('Offer price is required.'),
  areaSqft: yup.number().typeError('Carpet area should be a valid number.').integer('Carpet area should be a whole number.').min(1, 'Carpet area should be greater than 0.').required('Carpet area is required.'),
  areaUnit: yup.string().oneOf(Object.values(AREA_UNIT), 'Please select a valid area unit.').required('Area unit is required.'),
  streetName: yup.string().trim().required('Street name is required.'),
  areaName: yup.string().trim().required('Area name is required.'),
  landmark: yup.string().nullable(),
  locality: yup.string().trim().required('Locality is required.'),
  city: yup.string().trim().required('City is required.'),
  bedrooms: yup.number().typeError('Bedrooms must be a number.').integer('Bedrooms must be a whole number.').min(0, 'Bedrooms cannot be negative.').required('Number of bedrooms is required.'),
  bathrooms: yup.number().typeError('Bathrooms must be a number.').integer('Bathrooms must be a whole number.').min(0, 'Bathrooms cannot be negative.').required('Number of bathrooms is required.'),
  furnished: yup.boolean().default(false)
}).required();

const PropertyForm = ({ initialData, onSubmit, isLoading, submitLabel = 'Save Property', onValuesChange, showImageUpload = false }) => {
  const { control, register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      title: '',
      configuration: '',
      propertyType: PROPERTY_TYPE.APARTMENT,
      offerType: OFFER_TYPE.SELL,
      offerCost: '',
      areaSqft: '',
      areaUnit: AREA_UNIT.SQ_FT,
      bedrooms: 0,
      bathrooms: 0,
      streetName: '',
      areaName: '',
      landmark: '',
      locality: '',
      city: '',
      furnished: false
    }
  });

  const [nearbyAmenities, setNearbyAmenities] = useState(
    initialData?.nearbyAmenities ?? []
  );
  const [amenityError, setAmenityError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const lastPreviewPayloadRef = useRef('');
  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (!onValuesChange) {
      return undefined;
    }

    const nextPayload = {
      ...getValues(),
      ...watchedValues,
      nearbyAmenities,
    };
    const payloadSignature = JSON.stringify(nextPayload);

    if (payloadSignature === lastPreviewPayloadRef.current) {
      return undefined;
    }

    lastPreviewPayloadRef.current = payloadSignature;
    onValuesChange(nextPayload);

    return undefined;
  }, [getValues, nearbyAmenities, onValuesChange, watchedValues]);

  const streetName = watchedValues?.streetName;
  const areaName = watchedValues?.areaName;
  const landmark = watchedValues?.landmark;
  const locality = watchedValues?.locality;
  const city = watchedValues?.city;

  const handleFilesSelected = (e) => {
    const newFiles = Array.from(e.target.files || []).filter((f) =>
      ACCEPTED_MIME.includes(f.type)
    );
    if (newFiles.length === 0) return;

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles].slice(0, MAX_FILES);
      // Build fresh preview URLs only for newly added files
      setLocalPreviews((prevPreviews) => {
        const extra = combined.slice(prevPreviews.length).map((f) => URL.createObjectURL(f));
        return [...prevPreviews, ...extra].slice(0, MAX_FILES);
      });
      return combined;
    });
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setLocalPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFormSubmit = (formData) => {
    // Validate all three amenity types are covered before sending
    const coveredTypes = new Set(nearbyAmenities.map((a) => a.type));
    const missing = REQUIRED_AMENITY_TYPES.filter((t) => !coveredTypes.has(t));
    if (missing.length > 0) {
      const labels = missing.map((t) => t.replace('_', ' ').toLowerCase()).join(', ');
      setAmenityError(`Please provide details for: ${labels}.`);
      return;
    }
    setAmenityError('');
    onSubmit({
      ...formData, nearbyAmenities,
    }, selectedFiles);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Property Name</label>
          <input {...register('title')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., Luxury 3BHK in Indiranagar" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Property Configuration</label>
          <input {...register('configuration')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., 2BHK, Studio, Office Space" />
          {errors.configuration && <p className="text-red-500 text-xs mt-1">{errors.configuration.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Property Type</label>
          <select {...register('propertyType')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent">
            <option value="">Select Type</option>
            {Object.values(PROPERTY_TYPE).map(type => (
              <option key={type} value={type}>{formatEnumLabel(type)}</option>
            ))}
          </select>
          {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Offer Type</label>
          <select {...register('offerType')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent">
            <option value="">Select Offer Type</option>
            {Object.values(OFFER_TYPE).map(type => (
              <option key={type} value={type}>{formatEnumLabel(type)}</option>
            ))}
          </select>
          {errors.offerType && <p className="text-red-500 text-xs mt-1">{errors.offerType.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Offer Price (₹)</label>
          <input type="number" {...register('offerCost')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" />
          {errors.offerCost && <p className="text-red-500 text-xs mt-1">{errors.offerCost.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Carpet Area</label>
          <input type="number" {...register('areaSqft')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., 1200" />
          {errors.areaSqft && <p className="text-red-500 text-xs mt-1">{errors.areaSqft.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Area Unit</label>
          <select {...register('areaUnit')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent">
            {Object.values(AREA_UNIT).map((unit) => (
              <option key={unit} value={unit}>{getAreaUnitLabel(unit)}</option>
            ))}
          </select>
          {errors.areaUnit && <p className="text-red-500 text-xs mt-1">{errors.areaUnit.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bedrooms</label>
          <input type="number" {...register('bedrooms')} min="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., 3" />
          {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bathrooms</label>
          <input type="number" {...register('bathrooms')} min="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., 2" />
          {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Street Name</label>
          <input {...register('streetName')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., JNTU Hitech City Road" />
          {errors.streetName && <p className="text-red-500 text-xs mt-1">{errors.streetName.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Area Name</label>
          <input {...register('areaName')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., KPHB Colony" />
          {errors.areaName && <p className="text-red-500 text-xs mt-1">{errors.areaName.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Landmark</label>
          <input {...register('landmark')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., Near Hitech City Railway Station" />
          {errors.landmark && <p className="text-red-500 text-xs mt-1">{errors.landmark.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Locality</label>
          <input {...register('locality')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., Hitech City" />
          {errors.locality && <p className="text-red-500 text-xs mt-1">{errors.locality.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City</label>
          <input {...register('city')} className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent" placeholder="e.g., Bangalore" />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
        </div>

      </div>

      {/* ── Proximity / Nearby Amenities ── */}
      <div className="border-t border-slate-100 pt-6">
        <ProximityAmenities
          streetName={streetName}
          areaName={areaName}
          landmark={landmark}
          locality={locality}
          city={city}
          initialAmenities={initialData?.nearbyAmenities}
          onChange={setNearbyAmenities}
          error={amenityError}
        />
      </div>

      {showImageUpload && (
        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Images <span className="text-slate-300 font-normal normal-case">(optional, up to {MAX_FILES})</span></h3>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= MAX_FILES}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl py-8 text-slate-400 hover:border-[#E9B38F] hover:text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16l4-4 4 4 4-6 5 6M3 20h18M14 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <span className="text-sm font-black">Click to select images</span>
            <span className="text-xs">JPEG, PNG, WebP — max {MAX_FILES} files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          {localPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {localPreviews.map((src, idx) => (
                <div key={src} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove"
                  >
                    ✕
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full font-black">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 text-slate-900 font-black text-sm rounded-full disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#E9B38F' }}
        >
          {isLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;