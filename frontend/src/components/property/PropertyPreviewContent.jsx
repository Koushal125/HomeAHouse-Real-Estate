import { useMemo } from 'react';
import { formatEnumLabel, getAreaUnitLabel, getOfferTypeLabel } from '../../utils/enums';
import { normalizeProperty } from '../../utils/normalizers';

const AMENITY_GROUPS = [
  { key: 'HOSPITAL', label: 'Hospitals' },
  { key: 'SCHOOL', label: 'Schools' },
  { key: 'POLICE_STATION', label: 'Police Stations' },
];

const groupAmenities = (amenities = []) =>
  AMENITY_GROUPS.reduce(
    (groups, group) => ({
      ...groups,
      [group.key]: amenities.filter((item) => item.type === group.key),
    }),
    {}
  );

const PreviewSection = ({ title, children, variant }) => (
  <section
    className={
      variant === 'panel'
        ? 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
        : 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm'
    }
  >
    <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 font-semibold text-slate-900">{value}</p>
  </div>
);

const AmenityGroup = ({ title, items, variant }) => (
  <div
    className={
      variant === 'panel'
        ? 'rounded-xl border border-slate-200 bg-slate-50 p-4'
        : 'rounded-2xl border border-slate-100 p-4'
    }
  >
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item.type}-${item.name}-${index}`} className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-600">{item.distanceKm} km from listing</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate-500">No details provided.</p>
    )}
  </div>
);

const formatPrice = (price) => (price > 0 ? `₹${price.toLocaleString()}` : 'Add offer price');

const formatArea = (area, areaUnit) => (area > 0 ? `${area} ${getAreaUnitLabel(areaUnit)}` : 'Add carpet area');

const PropertyPreviewContent = ({ draft, variant = 'full' }) => {
  const previewProperty = useMemo(() => normalizeProperty(draft ?? {}), [draft]);
  const amenitiesByType = useMemo(() => groupAmenities(draft?.nearbyAmenities ?? []), [draft]);
  const isPanel = variant === 'panel';

  const locationLine = [
    previewProperty.streetName,
    previewProperty.areaName,
    previewProperty.landmark,
    previewProperty.locality,
    previewProperty.city,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={isPanel ? 'space-y-4' : 'space-y-6'}>
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg shadow-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.18),_transparent_30%)]" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
              {isPanel ? 'Live Preview' : 'Listing Snapshot'}
            </span>
            <span className="rounded-full bg-sky-300/15 px-3 py-1 text-xs font-semibold text-sky-100">
              {getOfferTypeLabel(previewProperty.offerType) || 'Select offer type'}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className={isPanel ? 'text-2xl font-semibold tracking-tight' : 'text-3xl font-bold tracking-tight'}>
              {previewProperty.title?.trim() || 'Untitled Property'}
            </h2>
            <p className="text-sm text-slate-300">
              {locationLine || 'Start entering the address fields to build a full listing preview.'}
            </p>
            <p className="text-sm text-slate-200">
              {previewProperty.configuration?.trim() || 'Add the configuration details to describe the layout.'}
            </p>
          </div>

          <div className={isPanel ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 md:grid-cols-3'}>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Offer Price</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatPrice(previewProperty.price ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Carpet Area</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatArea(previewProperty.area ?? 0, previewProperty.areaUnit)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Property Type</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatEnumLabel(previewProperty.propertyType) || 'Select property type'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PreviewSection title="Property Details" variant={variant}>
        <div className={isPanel ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'grid grid-cols-2 gap-4 md:grid-cols-3'}>
          <DetailItem label="Type" value={formatEnumLabel(previewProperty.propertyType) || 'Not provided'} />
          <DetailItem label="Carpet Area" value={formatArea(previewProperty.area ?? 0, previewProperty.areaUnit)} />
          <DetailItem label="Bedrooms" value={previewProperty.bedrooms ?? 'Not provided'} />
          <DetailItem label="Bathrooms" value={previewProperty.bathrooms ?? 'Not provided'} />
          <DetailItem label="Furnished" value={previewProperty.furnished ? 'Yes' : 'No'} />
          <DetailItem label="Street Name" value={previewProperty.streetName || 'Not provided'} />
          <DetailItem label="Area Name" value={previewProperty.areaName || 'Not provided'} />
          <DetailItem label="Landmark" value={previewProperty.landmark || 'Not provided'} />
          <DetailItem label="Locality" value={previewProperty.locality || 'Not provided'} />
          <DetailItem label="City" value={previewProperty.city || 'Not provided'} />
        </div>
      </PreviewSection>

      <PreviewSection title="Nearby Amenities" variant={variant}>
        <div className={isPanel ? 'grid gap-4' : 'grid gap-4 md:grid-cols-3'}>
          {AMENITY_GROUPS.map((group) => (
            <AmenityGroup key={group.key} title={group.label} items={amenitiesByType[group.key]} variant={variant} />
          ))}
        </div>
      </PreviewSection>
    </div>
  );
};

export default PropertyPreviewContent;