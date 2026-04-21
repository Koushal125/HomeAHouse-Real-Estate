import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

const AMENITY_TYPES = [
  { key: 'HOSPITAL',       label: 'Hospital',       icon: '🏥' },
  { key: 'SCHOOL',         label: 'School',          icon: '🏫' },
  { key: 'POLICE_STATION', label: 'Police Station',  icon: '🚔' },
];

const emptyEntry = (type) => ({ type, name: '', address: '', distanceKm: '', autoFetched: false });

const createAmenityState = (items = []) => {
  const nextState = {
    HOSPITAL: [],
    SCHOOL: [],
    POLICE_STATION: [],
  };

  for (const item of items) {
    if (item?.type && nextState[item.type]) {
      nextState[item.type].push({
        type: item.type,
        name: item.name ?? '',
        address: item.address ?? '',
        distanceKm: item.distanceKm ?? '',
        autoFetched: Boolean(item.autoFetched),
      });
    }
  }

  return nextState;
};

const ManualAmenityForm = ({ type, entry, onChange }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Name *</label>
      <input
        type="text"
        value={entry.name}
        onChange={(e) => onChange({ ...entry, name: e.target.value, type, autoFetched: false })}
        placeholder="e.g., City General Hospital"
        className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#E9B38F] focus:outline-none focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Address *</label>
      <input
        type="text"
        value={entry.address}
        onChange={(e) => onChange({ ...entry, name: entry.name, address: e.target.value, type, autoFetched: false })}
        placeholder="e.g., 12 MG Road, Bangalore"
        className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#E9B38F] focus:outline-none focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Distance (km) *</label>
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={entry.distanceKm}
        onChange={(e) => onChange({ ...entry, name: entry.name, address: entry.address, distanceKm: e.target.value, type, autoFetched: false })}
        placeholder="e.g., 1.5"
        className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#E9B38F] focus:outline-none focus:border-transparent"
      />
    </div>
  </div>
);

const AmenityList = ({ items }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
        Auto-fetched
      </span>
      <span className="text-xs text-slate-500">Nearest {items.length}</span>
    </div>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item.type}-${item.name}-${index}`} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
          <p className="text-sm font-black text-slate-800">{item.name}</p>
          <p className="text-xs text-slate-500">{item.distanceKm} km from listing</p>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * ProximityAmenities — manages nearby hospital, school & police station data.
 *
 * Props:
 *  - streetName (string): current street name value from the parent form
 *  - areaName (string): current area name value from the parent form
 *  - landmark (string): current landmark value from the parent form
 *  - locality (string): current locality value from the parent form
 *  - city    (string): current city value from the parent form
 *  - initialAmenities (array): amenities already attached to the property
 *  - onChange (fn):    called with the amenity array whenever it changes
 *  - error   (string): validation error message to display
 */
const ProximityAmenities = ({ streetName, areaName, landmark, locality, city, initialAmenities, onChange, error }) => {
  const [status, setStatus]   = useState('idle'); // idle | loading | done | failed
  const [amenities, setAmenities] = useState(() => createAmenityState(initialAmenities));

  useEffect(() => {
    setAmenities(createAmenityState(initialAmenities));
  }, [initialAmenities]);

  const notify = useCallback((updated) => {
    const list = Object.values(updated)
      .flat()
      .filter((e) => e.name && e.address && parseFloat(e.distanceKm) > 0);

    onChange(list.map((e) => ({
      type: e.type,
      name: e.name.trim(),
      address: e.address.trim(),
      distanceKm: parseFloat(e.distanceKm),
      autoFetched: e.autoFetched,
    })));
  }, [onChange]);

  const handleFetch = async () => {
    if (!locality?.trim() || !city?.trim()) {
      alert('Please fill in at least Locality and City before fetching amenities.');
      return;
    }
    setStatus('loading');
    try {
      const { data } = await api.get('/proximity/amenities', {
        params: {
          streetName: streetName?.trim() || undefined,
          areaName: areaName?.trim() || undefined,
          landmark: landmark?.trim() || undefined,
          locality: locality?.trim() || undefined,
          city: city.trim(),
        },
      });

      // Build updated amenity map from response
      const updated = {
        HOSPITAL: [],
        SCHOOL: [],
        POLICE_STATION: [],
      };
      for (const item of data) {
        updated[item.type].push({
          type: item.type,
          name: item.name,
          address: item.address,
          distanceKm: item.distanceKm,
          autoFetched: true,
        });
      }
      // Keep any existing manual entries for types not returned by auto-fetch
      for (const t of AMENITY_TYPES) {
        if (updated[t.key].length === 0 && amenities[t.key]?.some((item) => !item.autoFetched)) {
          updated[t.key] = amenities[t.key];
        }
      }
      setAmenities(updated);
      setStatus('done');
      notify(updated);
    } catch (err) {
      console.error('Proximity auto-fetch failed:', err?.response?.data || err?.message || err);
      setStatus('failed');
    }
  };

  const handleEntryChange = (type, newEntry) => {
    const updated = { ...amenities, [type]: [newEntry] };
    setAmenities(updated);
    notify(updated);
  };

  const missingTypes = AMENITY_TYPES.filter(({ key }) => {
    const entries = amenities[key] ?? [];
    return entries.length === 0 || !entries.some((e) => e.name && e.address && parseFloat(e.distanceKm) > 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Nearby Amenities</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hospital, school &amp; police station details are <span className="font-medium text-red-600">required</span> before submission.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={status === 'loading'}
          className="px-5 py-2 text-sm font-black text-slate-900 rounded-full disabled:opacity-50 flex items-center gap-2"
          style={{ backgroundColor: '#E9B38F' }}
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Fetching…
            </>
          ) : (
            '📍 Auto-fetch Nearby'
          )}
        </button>
      </div>

      {status === 'failed' && (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
          Could not auto-fetch amenities. Please enter the details manually below.
        </p>
      )}

      {status === 'done' && missingTypes.length > 0 && (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
          Could not locate: {missingTypes.map((t) => t.label).join(', ')}. Please fill in the details manually.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AMENITY_TYPES.map(({ key, label, icon }) => {
          const entries = amenities[key] ?? [];
          const autoFetchedEntries = entries.filter((item) => item.autoFetched);
          const manualEntry = entries.find((item) => !item.autoFetched) ?? emptyEntry(key);
          const hasFetchedEntries = autoFetchedEntries.length > 0;

          return (
            <div key={key} className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {icon} {label}
                {!hasFetchedEntries && (
                  <span className="ml-1 text-xs font-normal text-red-500">(required)</span>
                )}
              </p>

              {hasFetchedEntries ? (
                <AmenityList items={autoFetchedEntries} />
              ) : (
                <ManualAmenityForm
                  type={key}
                  entry={manualEntry}
                  onChange={(updated) => handleEntryChange(key, updated)}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default ProximityAmenities;
