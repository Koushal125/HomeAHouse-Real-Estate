import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PropertyCard from '../../components/property/PropertyCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { Heart } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

// The API returns FavoriteResponse objects — normalise them to the shape PropertyCard expects
const favoriteToProperty = (fav) => ({
  id: fav.propertyId,
  propId: fav.propertyId,
  title: fav.title,
  city: fav.city,
  street: fav.street,
  locality: fav.street || fav.city,
  propertyType: fav.propertyType,
  offerType: fav.offerType,
  listingType: fav.offerType,
  status: fav.status,
  price: fav.offerCost,
  offerCost: fav.offerCost,
  area: fav.areaSqft,
  areaSqft: fav.areaSqft,
  bedrooms: fav.bedrooms,
  bathrooms: fav.bathrooms,
  furnished: fav.furnished,
  imageUrls: fav.imageUrls ?? [],
  imageUrl: fav.imageUrls?.length > 0 ? fav.imageUrls[0] : null,
});

const SavedListings = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data ?? []);
    } catch {
      setError('Failed to load your saved listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleUnsave = useCallback((propertyId) => {
    setFavorites((prev) => prev.filter((f) => f.propertyId !== propertyId));
  }, []);

  if (isLoading) return <PageSpinner message="Loading your saved listings…" />;

  return (
    <PageShell
      label="Favourites"
      icon={<Heart size={10} strokeWidth={2.5} />}
      title="Saved Listings"
      subtitle="Properties you have saved for later."
      accentHex="#F59E0B"
    >
      <div className="space-y-8 animate-slide-up">

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm">
          <Heart size={16} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {!error && favorites.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-dark pointer-events-none opacity-60" />
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Heart size={24} strokeWidth={2} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-500 mb-1">No saved listings yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">Browse properties and tap the heart to save them here.</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 text-sm font-black rounded-full shadow-sm"
            style={{ backgroundColor: '#E9B38F' }}
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <PropertyCard
              key={fav.favoriteId}
              property={favoriteToProperty(fav)}
              initialSaved={true}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}
      </div>
    </PageShell>
  );
};

export default SavedListings;
