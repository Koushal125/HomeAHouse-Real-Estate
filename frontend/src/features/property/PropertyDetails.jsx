import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart, Bookmark, BedDouble, Bath, Maximize2, Home, CheckSquare, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { ROUTES, ROLES } from '../../utils/constants';
import PropertyCard from '../../components/property/PropertyCard';
import TransactionModal from '../../components/property/TransactionModal';
import EmiCalculator from '../../components/property/EmiCalculator';
import SiteVisitModal from '../../components/property/SiteVisitModal';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatEnumLabel, getAreaUnitLabel, getPropertyStatusLabel, getOfferActionLabel, getDealStatusLabel } from '../../utils/enums';
import { normalizeProperty, normalizeDeal } from '../../utils/normalizers';
import InlineNavbar from '../../components/layout/InlineNavbar';

const SIMILAR_LISTINGS_LIMIT = 3;

const groupAmenities = (amenities = []) => ({
  HOSPITAL: amenities.filter((item) => item.type === 'HOSPITAL'),
  SCHOOL: amenities.filter((item) => item.type === 'SCHOOL'),
  POLICE_STATION: amenities.filter((item) => item.type === 'POLICE_STATION'),
});

const AmenityGroup = ({ title, items }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</h3>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item.type}-${item.name}-${index}`} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-800">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{item.address || 'Address not available'}</p>
            <p className="mt-0.5 text-[11px] font-bold" style={{ color: '#E9B38F' }}>{item.distanceKm} km away</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-slate-400">None nearby.</p>
    )}
  </div>
);

const buildSimilarListingEndpoints = (currentProperty) => {
  const params = new URLSearchParams();

  if (currentProperty.city) {
    params.append('city', currentProperty.city);
  }

  if (currentProperty.propertyType) {
    params.append('propertyType', currentProperty.propertyType);
  }

  if (!params.toString()) {
    return ['/properties'];
  }

  return [`/properties/search?${params.toString()}`, '/properties'];
};

const getSimilarityScore = (candidate, currentProperty) => {
  let score = 0;

  if (candidate.propertyType && candidate.propertyType === currentProperty.propertyType) {
    score += 4;
  }

  if (candidate.listingType && candidate.listingType === currentProperty.listingType) {
    score += 3;
  }

  if (candidate.city && currentProperty.city && candidate.city.toLowerCase() === currentProperty.city.toLowerCase()) {
    score += 2;
  }

  if (candidate.locality && currentProperty.locality && candidate.locality.toLowerCase() === currentProperty.locality.toLowerCase()) {
    score += 2;
  }

  if (
    candidate.bedrooms != null &&
    currentProperty.bedrooms != null &&
    Number(candidate.bedrooms) === Number(currentProperty.bedrooms)
  ) {
    score += 1;
  }

  if (candidate.status === 'AVAILABLE' || !candidate.status) {
    score += 1;
  }

  if (candidate.price && currentProperty.price) {
    const priceDeltaRatio = Math.abs(candidate.price - currentProperty.price) / currentProperty.price;

    if (priceDeltaRatio <= 0.15) {
      score += 2;
    } else if (priceDeltaRatio <= 0.3) {
      score += 1;
    }
  }

  return score;
};

const rankSimilarListings = (candidates, currentProperty) => {
  return candidates
    .map((candidate) => ({
      property: candidate,
      score: getSimilarityScore(candidate, currentProperty),
      priceDelta: currentProperty.price && candidate.price
        ? Math.abs(candidate.price - currentProperty.price)
        : Number.POSITIVE_INFINITY,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.priceDelta - right.priceDelta)
    .slice(0, SIMILAR_LISTINGS_LIMIT)
    .map(({ property: candidate }) => candidate);
};

const fetchPropertyDetails = async (propertyId) => {
  const response = await api.get(`/properties/${propertyId}`);
  return normalizeProperty(response.data);
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Bring in Auth State to secure the transaction button
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // ✅ Checkbox 1 & 2: Added loading and error states
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [similarListings, setSimilarListings] = useState([]);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeDeal, setActiveDeal] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const visitBtnRef = useRef(null);
  const buyBtnRef = useRef(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProperty = async () => {
      setIsLoading(true);
      setError('');

      try {
        const nextProperty = await fetchPropertyDetails(id);

        if (isActive) {
          setProperty(nextProperty);
          // Fetch deal info for properties that are no longer simply AVAILABLE
          if (nextProperty.status && nextProperty.status !== 'AVAILABLE') {
            try {
              const dealRes = await api.get(`/deals/property/${nextProperty.id}`);
              if (isActive && dealRes.status === 200) {
                setActiveDeal(normalizeDeal(dealRes.data));
              }
            } catch {
              // Non-critical – silently ignore if deal info unavailable
            }
          }
        }
      } catch {
        if (isActive) {
          setProperty(null);
          setError('Property not found or has been removed.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      isActive = false;
    };
  }, [id]);

  const fetchProperty = async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextProperty = await fetchPropertyDetails(id);
      setProperty(nextProperty);
      if (nextProperty.status && nextProperty.status !== 'AVAILABLE') {
        try {
          const dealRes = await api.get(`/deals/property/${nextProperty.id}`);
          if (dealRes.status === 200) setActiveDeal(normalizeDeal(dealRes.data));
        } catch {
          // Silently ignore
        }
      } else {
        setActiveDeal(null);
      }
    } catch {
      setProperty(null);
      setError('Property not found or has been removed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!property?.id) {
      setSimilarListings([]);
      return undefined;
    }

    let isActive = true;

    const fetchSimilarListings = async () => {
      setIsSimilarLoading(true);

      try {
        const endpoints = buildSimilarListingEndpoints(property);
        const similarCandidates = new Map();

        for (const endpoint of endpoints) {
          const response = await api.get(endpoint);
          const data = response.data?.content || response.data || [];

          data
            .map(normalizeProperty)
            .filter((candidate) => candidate?.id && Number(candidate.id) !== Number(property.id))
            .forEach((candidate) => {
              similarCandidates.set(candidate.id, candidate);
            });

          if (similarCandidates.size >= SIMILAR_LISTINGS_LIMIT * 2) {
            break;
          }
        }

        if (isActive) {
          setSimilarListings(rankSimilarListings(Array.from(similarCandidates.values()), property));
        }
      } catch {
        if (isActive) {
          setSimilarListings([]);
        }
      } finally {
        if (isActive) {
          setIsSimilarLoading(false);
        }
      }
    };

    fetchSimilarListings();

    return () => {
      isActive = false;
    };
  }, [property]);

  const handleTransactionSuccess = () => {
    setIsModalOpen(false);
    setTransactionSuccess(true);
    // Re-fetch the property so the UI updates to show it is now SOLD/RENTED
    fetchProperty();
  };

  if (isLoading) return <PageSpinner message="Loading property details…" />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 px-6 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
        <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={14} strokeWidth={2.5} /> Return to Listings
        </Link>
      </div>
    );
  }

  // Determine if the property is still on the market
  const isAvailable = property.status === 'AVAILABLE' || !property.status;
  const isCustomer = user?.role === ROLES.CUSTOMER;
  const isOwnProperty = isCustomer && property.ownerId != null && Number(user?.id) === Number(property.ownerId);
  const actionLabel = getOfferActionLabel(property.listingType);
  const amenitiesByType = groupAmenities(property.nearbyAmenities);
  const galleryImages = property.imageUrls && property.imageUrls.length > 0
    ? property.imageUrls
    : (property.imageUrl ? [property.imageUrl] : []);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-white border-b border-slate-100">
        <InlineNavbar variant="light" />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8 font-sans space-y-6">
      <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
        <ArrowLeft size={14} strokeWidth={2.5} /> Back to Listings
      </Link>

      {transactionSuccess && (
        <div className="flex items-center justify-between gap-4 rounded-[40px] border border-slate-100 bg-slate-50 px-6 py-4 shadow-sm">
          <p className="text-sm font-black text-slate-900">Congratulations! Transaction successfully processed.</p>
          <button onClick={() => navigate(ROUTES.MY_TRANSACTIONS)} className="text-xs font-black rounded-full px-4 py-2 shrink-0" style={{ backgroundColor: '#E9B38F' }}>View Transactions</button>
        </div>
      )}

      {activeDeal && activeDeal.status !== 'CLOSED' && (
        <div className="flex items-center gap-4 rounded-[40px] border border-slate-200 bg-slate-50 px-6 py-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <Home size={16} strokeWidth={2} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">Deal in progress — <span>{getDealStatusLabel(activeDeal.status)}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">This property is currently reserved. The deal will be finalised by the managing broker.</p>
          </div>
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="flex flex-col lg:flex-row gap-4 max-w-screen-xl mx-auto">

        {/* Left: Image gallery */}
        <div className="lg:w-[58%] relative bg-slate-100 rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
          <div className="relative h-[368px] lg:h-[391px]">
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[activeImageIndex]}
                alt={`${property.title} — image ${activeImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-base font-medium">
                No Image Available
              </div>
            )}

            {/* Prev / Next */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
                  aria-label="Previous image"
                >‹</button>
                <button
                  onClick={() => setActiveImageIndex((i) => (i + 1) % galleryImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
                  aria-label="Next image"
                >›</button>
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-white/80 backdrop-blur-sm">
              {galleryImages.map((src, idx) => (
                <button
                  key={src}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === activeImageIndex ? 'border-[#E9B38F] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info panel */}
        <div className="lg:w-[42%] p-7 flex flex-col justify-between gap-5 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-y-auto max-h-[483px]">

          {/* Title + address + save/like */}
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-3">
              <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{property.title}</h1>
              {!isAvailable && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {getPropertyStatusLabel(property.status)}
                </span>
              )}
              <p className="text-slate-500 text-sm mt-1">
                {[property.areaName || property.locality, property.city].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Like">
                <Heart className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Save">
                <Bookmark className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {/* Row 1: beds, baths, area */}
            <div className="flex justify-between">
              {property.bedrooms != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{property.bedrooms}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-0.5 justify-center"><BedDouble size={11} /> beds</p>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{property.bathrooms}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-0.5 justify-center"><Bath size={11} /> baths</p>
                </div>
              )}
              {property.area != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{property.area?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-0.5 justify-center"><Maximize2 size={11} /> {getAreaUnitLabel(property.areaUnit)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-6 border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-black text-slate-800 flex items-center gap-1"><Home size={12} className="text-slate-400" />{formatEnumLabel(property.propertyType)}</p>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 flex items-center gap-1"><CheckSquare size={12} className="text-slate-400" />{property.furnished ? 'Furnished' : 'Non-Furnished'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{property.price?.toLocaleString('en-IN')}</p>
            <span className="px-3 py-1 border border-slate-200 rounded-full text-xs font-bold text-slate-500">
              {property.listingType === 'SELL' ? 'Sale' : 'Rental'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-slate-900 text-lg shadow-sm" style={{ backgroundColor: '#E9B38F' }}>
                {property.brokerName?.[0] || 'B'}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Agent</p>
                <p className="font-black text-slate-800 tracking-tight">{property.brokerName || 'Verified Broker'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((star) => (
                  <svg key={star} className={`w-3.5 h-3.5 ${star <= 4 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">4.0 · 12 reviews</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-2">
            {!isAvailable ? (
              <button disabled className="flex-1 bg-slate-100 text-slate-400 py-2.5 rounded-full text-sm font-black cursor-not-allowed">
                Property Unavailable
              </button>
            ) : isOwnProperty ? (
              <button disabled className="flex-1 bg-slate-50 text-slate-500 border border-slate-200 py-2.5 rounded-full text-sm font-black cursor-not-allowed">
                Your Own Listing
              </button>
            ) : isAuthenticated && isCustomer ? (
              <button
                ref={buyBtnRef}
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading || !property}
                className="flex-1 py-2.5 rounded-full text-sm font-black text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#E9B38F' }}
              >
                {actionLabel === 'Purchase' ? 'Buy Now' : 'Rent Now'}
              </button>
            ) : !isAuthenticated ? (
              <button
                onClick={() => navigate(ROUTES.LOGIN, { state: { message: 'Please log in to make an offer.' } })}
                className="flex-1 py-2.5 rounded-full text-sm font-black text-slate-900 transition-colors"
                style={{ backgroundColor: '#E9B38F' }}
              >
                Log in to Make Offer
              </button>
            ) : null}

            {/* Schedule a Visit */}
            {isAvailable && isAuthenticated && isCustomer && !isOwnProperty && (
              <div className="relative flex-1">
                <button
                  ref={visitBtnRef}
                  onClick={() => setIsVisitModalOpen((v) => !v)}
                  className="w-full py-2.5 border border-slate-200 rounded-full text-sm font-black text-slate-700 hover:bg-slate-50 transition-all"
                >
                  📅 Schedule a Visit
                </button>
                <SiteVisitModal
                  propertyId={property.id}
                  propertyTitle={property.title}
                  isOpen={isVisitModalOpen}
                  onClose={() => setIsVisitModalOpen(false)}
                  anchorRef={visitBtnRef}
                />
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Listing Details</h2>
            <p className="text-sm text-slate-400 mb-3">
              📍 {[
                property.streetName,
                property.areaName,
                property.landmark ? `near ${property.landmark}` : null,
                property.locality,
                property.city,
              ].filter(Boolean).join(', ')}
            </p>
            <p className="text-slate-600 text-base leading-loose whitespace-pre-wrap">
              {property.description}
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-black text-slate-900 tracking-tight">Nearby Amenities</h2>
            <div className="grid grid-cols-3 gap-2">
              <AmenityGroup title="Hospitals" items={amenitiesByType.HOSPITAL} />
              <AmenityGroup title="Schools" items={amenitiesByType.SCHOOL} />
              <AmenityGroup title="Police Stations" items={amenitiesByType.POLICE_STATION} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Property Reviews</p>
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 gap-2">
              <p className="text-sm">No reviews yet. Be the first to review this property.</p>
            </div>
          </div>

          {(property.listingType === 'SELL' || property.offerType === 'SELL') && (
            <div className="rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-slate-900 tracking-tight">EMI Calculator</h2>
              <EmiCalculator defaultAmount={property.price} />
            </div>
          )}
        </div>
      </div>

      <section className="mt-14 border-t border-slate-100 pt-10">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">Similar Listings</h2>
            <p className="text-sm text-slate-400">
              More {formatEnumLabel(property.propertyType || 'properties').toLowerCase()} around {property.locality || property.city || 'this area'}.
            </p>
          </div>
          <Link to="/properties" className="text-sm font-black text-slate-500 hover:text-slate-900 transition-colors">Browse all listings</Link>
        </div>

        {isSimilarLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[40px] bg-slate-100" />
            ))}
          </div>
        ) : similarListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {similarListings.map((similarProperty) => (
              <PropertyCard key={similarProperty.id} property={similarProperty} />
            ))}
          </div>
        ) : (
          <div className="rounded-[40px] bg-slate-50 border border-slate-100 px-6 py-10 text-center text-sm text-slate-400">
            We could not find close matches for this listing yet. Try browsing the full catalog for more options.
          </div>
        )}
      </section>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        onSuccess={handleTransactionSuccess}
        anchorRef={buyBtnRef}
      />
      </div>
    </div>
  );
};

export default PropertyDetails;