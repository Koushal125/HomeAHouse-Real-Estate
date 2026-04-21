import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { List, Map, MapPin, Building2, CircleDollarSign, BedDouble, SlidersHorizontal, Search, ChevronDown, X } from 'lucide-react';
import InlineNavbar from '../layout/InlineNavbar';
import PageShell from '../layout/PageShell';
import api from '../../services/api';
import PropertyCard from '../../components/property/PropertyCard';
import MapView from '../../components/property/MapView';
import { PROPERTY_TYPE, formatEnumLabel } from '../../utils/enums';
import { normalizeProperty, parsePage } from '../../utils/normalizers';

const PropertyList = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [userLocation, setUserLocation] = useState(null); // { lat, lon } once granted

  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    city: '',
    propertyType: searchParams.get('type') ?? '',
    title: '',
    bedrooms: '',
    furnished: '',
  });
  const [globalQuery, setGlobalQuery] = useState(() => searchParams.get('search') ?? '');
  const [moreOpen, setMoreOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const moreRef = useRef(null);
  const priceRef = useRef(null);
  const typeRef = useRef(null);

  // Request user location once on mount for proximity-based sorting
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {} // silently ignore if denied
    );
  }, []);

  // Always-current refs so fetch functions never go stale
  const filtersRef = useRef(filters);
  const globalQueryRef = useRef(globalQuery);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { globalQueryRef.current = globalQuery; }, [globalQuery]);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (priceRef.current && !priceRef.current.contains(e.target)) setPriceOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [allProperties, setAllProperties] = useState([]); // used by map view
  const PAGE_SIZE = 12;

  const fetchProperties = useCallback(async (currentPage) => {
    const f = filtersRef.current;
    const q = globalQueryRef.current;
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (q) params.append('query', q);
      if (f.title) params.append('title', f.title);
      if (f.minPrice) params.append('minCost', f.minPrice);
      if (f.maxPrice) params.append('maxCost', f.maxPrice);
      if (f.city) params.append('city', f.city);
      if (f.propertyType) params.append('propertyType', f.propertyType);
      if (f.bedrooms) params.append('bedrooms', f.bedrooms);
      if (f.furnished !== '') params.append('furnished', f.furnished);
      if (userLocation) { params.append('userLat', userLocation.lat); params.append('userLon', userLocation.lon); }
      params.append('page', currentPage);
      params.append('size', PAGE_SIZE);

      const hasFilters = q || f.title || f.minPrice || f.maxPrice ||
        f.city || f.propertyType || f.bedrooms || f.furnished !== '';

      const endpoint = hasFilters
        ? `/properties/search?${params.toString()}`
        : `/properties?${params.toString()}`;
      const response = await api.get(endpoint);
      const result = parsePage(response.data);
      setProperties(result.items.map(normalizeProperty));
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error('Fetch failed', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — reads latest values via refs

  const fetchAllForMap = useCallback(async () => {
    const f = filtersRef.current;
    const q = globalQueryRef.current;
    try {
      const params = new URLSearchParams();
      if (q) params.append('query', q);
      if (f.title) params.append('title', f.title);
      if (f.minPrice) params.append('minCost', f.minPrice);
      if (f.maxPrice) params.append('maxCost', f.maxPrice);
      if (f.city) params.append('city', f.city);
      if (f.propertyType) params.append('propertyType', f.propertyType);
      if (f.bedrooms) params.append('bedrooms', f.bedrooms);
      if (f.furnished !== '') params.append('furnished', f.furnished);
      if (userLocation) { params.append('userLat', userLocation.lat); params.append('userLon', userLocation.lon); }
      params.append('page', 0);
      params.append('size', 500);

      const hasFilters = q || f.title || f.minPrice || f.maxPrice ||
        f.city || f.propertyType || f.bedrooms || f.furnished !== '';
      const endpoint = hasFilters
        ? `/properties/search?${params.toString()}`
        : `/properties?${params.toString()}`;
      const response = await api.get(endpoint);
      setAllProperties(parsePage(response.data).items.map(normalizeProperty));
    } catch {
      // silently ignore
    }
  }, []); // stable — reads latest values via refs

  // Sync navbar search query when URL ?search= param changes
  useEffect(() => {
    const q = searchParams.get('search') ?? '';
    const t = searchParams.get('type') ?? '';
    let changed = false;
    if (q !== globalQueryRef.current) {
      setGlobalQuery(q);
      globalQueryRef.current = q;
      changed = true;
    }
    if (t !== filtersRef.current.propertyType) {
      setFilters((prev) => ({ ...prev, propertyType: t }));
      changed = true;
    }
    if (changed) setPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    fetchProperties(page);
  }, [page, globalQuery, userLocation]); // re-fetch when location resolves

  // When switching to map view, or when filters/globalQuery change while map view is active, reload pins
  useEffect(() => {
    if (viewMode === 'map') {
      fetchAllForMap();
    }
  }, [viewMode, filters, globalQuery]);

  // Fetch saved listing IDs once so the heart icon reflects true state on load
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER') return;
    api.get('/favorites')
      .then((res) => {
        const ids = new Set((res.data || []).map((f) => f.propertyId));
        setSavedIds(ids);
      })
      .catch(() => {}); // silently ignore — heart defaults to unsaved
  }, [isAuthenticated, user]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    // Reset to page 0 so the user always sees results from the start
    // If already on page 0, manually trigger a fetch since the effect won't re-run
    if (page === 0) {
      fetchProperties(0);
    } else {
      setPage(0); // triggers the useEffect above
    }
  };

  // helpers
  const priceLabel = () => {
    if (filters.minPrice && filters.maxPrice) return `₹${Number(filters.minPrice).toLocaleString('en-IN')} – ₹${Number(filters.maxPrice).toLocaleString('en-IN')}`;
    if (filters.minPrice) return `From ₹${Number(filters.minPrice).toLocaleString('en-IN')}`;
    if (filters.maxPrice) return `Up to ₹${Number(filters.maxPrice).toLocaleString('en-IN')}`;
    return null;
  };

  const moreLabel = () => {
    const parts = [];
    if (filters.bedrooms) parts.push(`${filters.bedrooms}+ beds`);
    if (filters.furnished === 'true') parts.push('Furnished');
    if (filters.furnished === 'false') parts.push('Unfurnished');
    return parts.length ? parts.join(', ') : null;
  };

  const clearAll = () => {
    const empty = { minPrice: '', maxPrice: '', city: '', propertyType: '', title: '', bedrooms: '', furnished: '' };
    setFilters(empty);
    filtersRef.current = empty;
    if (page === 0) fetchProperties(0); else setPage(0);
  };

  const hasActiveFilters = filters.city || filters.propertyType || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.furnished !== '';

  return (
    <PageShell
      label="Explore"
      icon={<Search size={10} strokeWidth={2.5} />}
      title="Browse Properties"
      subtitle={totalElements > 0 ? `${totalElements.toLocaleString()} properties found` : 'Search and filter available listings'}
      accentHex="#E9B38F"
    >
      <div className="max-w-7xl mx-auto space-y-6">

      {/* Capsule filter bar */}
      <form onSubmit={applyFilters} className="mb-8">
        <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-md p-1.5 gap-0">

          {/* City */}
          <div className="flex-1 flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 rounded-full cursor-pointer transition-colors border-r border-gray-100 group">
            <MapPin className="text-gray-400 group-hover:text-amber-500 w-5 h-5 shrink-0 transition-colors" strokeWidth={1.5} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">City</span>
              <input
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Any city"
                className="text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-400 w-full"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="relative flex-1 border-r border-gray-100" ref={typeRef}>
            <button
              type="button"
              onClick={() => setTypeOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 rounded-full transition-colors group ${
                typeOpen || filters.propertyType ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              <Building2 className={`w-5 h-5 shrink-0 transition-colors ${
                typeOpen || filters.propertyType ? 'text-amber-500' : 'text-gray-400 group-hover:text-amber-500'
              }`} strokeWidth={1.5} />
              <div className="flex flex-col min-w-0 text-left flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Property type</span>
                <span className={`text-sm font-semibold truncate ${
                  filters.propertyType ? 'text-amber-700' : 'text-gray-400'
                }`}>
                  {filters.propertyType ? formatEnumLabel(filters.propertyType) : 'All types'}
                </span>
              </div>
              <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${
                typeOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {typeOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-[9999]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Select type</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFilters((f) => ({ ...f, propertyType: '' })); setTypeOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                      filters.propertyType === ''
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <span className="text-base">🏠</span>
                    All types
                  </button>
                  {Object.values(PROPERTY_TYPE).map((t) => {
                    const icons = {
                      APARTMENT: '🏢',
                      HOUSE: '🏡',
                      VILLA: '🏰',
                      PLOT: '🗺️',
                      COMMERCIAL: '🏬',
                      STUDIO: '🛋️',
                    };
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setFilters((f) => ({ ...f, propertyType: t })); setTypeOpen(false); }}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                          filters.propertyType === t
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <span className="text-base">{icons[t] ?? '🏠'}</span>
                        {formatEnumLabel(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="relative flex-1 border-r border-gray-100" ref={priceRef}>
            <button
              type="button"
              onClick={() => setPriceOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 rounded-full transition-colors group ${
                priceOpen || priceLabel() ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              <CircleDollarSign className={`w-5 h-5 shrink-0 transition-colors ${priceOpen || priceLabel() ? 'text-amber-500' : 'text-gray-400 group-hover:text-amber-500'}`} strokeWidth={1.5} />
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Price</span>
                {priceLabel() ? (
                  <span className="text-sm font-semibold text-amber-700 truncate">{priceLabel()}</span>
                ) : (
                  <span className="text-sm font-semibold text-gray-400">Any price</span>
                )}
              </div>
            </button>

            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 z-[9999] space-y-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Price range</p>

                {/* Min slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-500">Min price</label>
                    <span className="text-xs font-bold text-amber-600">
                      {filters.minPrice ? `₹${Number(filters.minPrice).toLocaleString('en-IN')}` : 'No min'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000000"
                    step="100000"
                    value={filters.minPrice || 0}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: val === '0' ? '' : val,
                        // ensure min doesn't exceed max
                        maxPrice: prev.maxPrice && Number(val) > Number(prev.maxPrice) ? val : prev.maxPrice,
                      }));
                    }}
                    className="w-full h-2 rounded-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>₹0</span><span>₹5 Cr</span>
                  </div>
                </div>

                {/* Max slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-500">Max price</label>
                    <span className="text-xs font-bold text-amber-600">
                      {filters.maxPrice ? `₹${Number(filters.maxPrice).toLocaleString('en-IN')}` : 'No max'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000000"
                    step="100000"
                    value={filters.maxPrice || 50000000}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: val === '50000000' ? '' : val,
                        // ensure max doesn't go below min
                        minPrice: prev.minPrice && Number(val) < Number(prev.minPrice) ? val : prev.minPrice,
                      }));
                    }}
                    className="w-full h-2 rounded-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>₹0</span><span>₹5 Cr</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '' }));
                    }}
                    className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    onClick={() => setPriceOpen(false)}
                    className="flex-1 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms (quick) */}
          <div className="flex-1 flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 rounded-full cursor-pointer transition-colors border-r border-gray-100 group">
            <BedDouble className="text-gray-400 group-hover:text-amber-500 w-5 h-5 shrink-0 transition-colors" strokeWidth={1.5} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Property name</span>
              <input
                name="title"
                value={filters.title}
                onChange={handleFilterChange}
                placeholder="RMZ Azure"
                className="text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-400 w-full"
              />
            </div>
          </div>

          {/* More Filters */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors border-l border-gray-100 mr-1.5 ${
                moreOpen || moreLabel() ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              <span className="text-sm font-semibold">{moreLabel() ?? 'More'}</span>
              <ChevronDown size={13} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 z-[9999] space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">More filters</p>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Min bedrooms</label>
                  <div className="flex gap-2 flex-wrap">
                    {['', '1', '2', '3', '4', '5'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, bedrooms: v }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                          filters.bedrooms === v
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300'
                        }`}
                      >
                        {v === '' ? 'Any' : `${v}+`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Furnished</label>
                  <div className="flex gap-2">
                    {[['', 'Any'], ['true', 'Furnished'], ['false', 'Unfurnished']].map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, furnished: v }))}
                        className={`flex-1 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                          filters.furnished === v
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  onClick={() => setMoreOpen(false)}
                  className="w-full py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white px-7 py-3.5 rounded-full font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <Search size={16} />
            Search
          </button>
        </div>

        {/* Active filter pills + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Active filters:</span>
            {filters.city && <Pill label={`City: ${filters.city}`} onRemove={() => { setFilters((f) => ({ ...f, city: '' })); }} />}
            {filters.propertyType && <Pill label={formatEnumLabel(filters.propertyType)} onRemove={() => setFilters((f) => ({ ...f, propertyType: '' }))} />}
            {filters.title && <Pill label={`Title: ${filters.title}`} onRemove={() => setFilters((f) => ({ ...f, title: '' }))} />}
            {priceLabel() && <Pill label={priceLabel()} onRemove={() => setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' }))} />}
            {filters.bedrooms && <Pill label={`${filters.bedrooms}+ beds`} onRemove={() => setFilters((f) => ({ ...f, bedrooms: '' }))} />}
            {filters.furnished !== '' && <Pill label={filters.furnished === 'true' ? 'Furnished' : 'Unfurnished'} onRemove={() => setFilters((f) => ({ ...f, furnished: '' }))} />}
            <button type="button" onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-1 underline">Clear all</button>
          </div>
        )}
      </form>

      {/* Header row */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Properties</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {totalElements > 0
              ? `${totalElements} result${totalElements !== 1 ? 's' : ''} found — page ${page + 1} of ${totalPages}`
              : 'No results found matching your criteria.'}
          </p>
        </div>
        {/* List / Map toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={15} /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map size={15} /> Map
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[40px]"></div>)}
        </div>
      ) : viewMode === 'map' ? (
        <MapView properties={allProperties} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map(p => <PropertyCard key={p.id} property={p} initialSaved={savedIds.has(p.id)} />)}
        </div>
      ) : (
        <div className="rounded-[40px] border border-slate-100 bg-white py-20 text-center text-slate-400 text-sm">
          No properties matched your current filters.
        </div>
      )}

        {/* Pagination controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-3 py-2 text-sm font-black rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            {/* Page number chips */}
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
              .reduce((acc, i, idx, arr) => {
                if (idx > 0 && i - arr[idx - 1] > 1) acc.push('ellipsis-' + i);
                acc.push(i);
                return acc;
              }, [])
              .map((item) =>
                typeof item === 'string' ? (
                  <span key={item} className="px-1 text-gray-400 text-sm select-none">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 text-sm font-black rounded-full border transition-colors ${
                      item === page
                        ? 'text-slate-900 border-transparent shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    style={item === page ? { backgroundColor: '#E9B38F' } : {}}
                  >
                    {item + 1}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm font-black rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 text-sm font-black rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};
const Pill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
    {label}
    <button type="button" onClick={onRemove} className="ml-0.5 hover:text-amber-900"><X size={11} /></button>
  </span>
);

export default PropertyList;