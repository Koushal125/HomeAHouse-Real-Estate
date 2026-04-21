import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { ArrowRight, Heart, MapPin, Maximize2, BedDouble, Bath } from 'lucide-react';
import { getOfferTypeLabel, getPropertyStatusLabel } from '../../utils/enums';
import { normalizeProperty } from '../../utils/normalizers';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ROUTES } from '../../utils/constants';

const ACCENT = '#E9B38F';

const statusStyle = {
  AVAILABLE:  'bg-emerald-500/90 text-white',
  PENDING:    'bg-amber-400/90   text-white',
  APPROVED:   'bg-sky-500/90     text-white',
  REJECTED:   'bg-red-500/90     text-white',
  RESERVED:   'text-slate-900',
  RENTED:     'bg-blue-500/90    text-white',
  SOLD:       'bg-slate-700/90   text-white',
  OFF_MARKET: 'bg-slate-500/90   text-white',
};

const offerTypeStyle = {
  SELL:             'bg-slate-900/80 text-white',
  RENT_LONG_TERM:   'text-slate-900',
  RENT_SHORT_TERM:  'bg-sky-600/80 text-white',
};

const PropertyCard = ({ property, initialSaved = false, onUnsave }) => {
  const p = normalizeProperty(property);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [saved, setSaved] = useState(initialSaved);
  const [savePending, setSavePending] = useState(false);

  const handleSaveToggle = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: window.location.pathname + window.location.search } },
        replace: false,
      });
      return;
    }

    if (savePending) return;
    setSavePending(true);
    try {
      if (saved) {
        await api.delete(`/favorites/${p.id}`);
        setSaved(false);
        showToast('Removed from saved listings', 'info');
        onUnsave?.(p.id);
      } else {
        await api.post(`/favorites/${p.id}`);
        setSaved(true);
        showToast('Saved to your listings!', 'success');
      }
    } catch {
      showToast('Could not update saved listing. Please try again.', 'error');
    } finally {
      setSavePending(false);
    }
  };

  const reservedStyle = { backgroundColor: ACCENT };
  const rentLongStyle = { backgroundColor: ACCENT };

  return (
    <div className="group bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-56 bg-slate-50 overflow-hidden shrink-0" style={{ borderRadius: '40px 40px 0 0' }}>
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9.75L12 4l9 5.75V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21V12h6v9" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-400">No Photo Available</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Offer-type pill */}
        <div
          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg backdrop-blur-sm ${offerTypeStyle[p.listingType] ?? 'bg-slate-900/80 text-white'}`}
          style={p.listingType === 'RENT_LONG_TERM' ? rentLongStyle : undefined}
        >
          {getOfferTypeLabel(p.listingType)}
        </div>

        {/* Status pill (only when not simply AVAILABLE) */}
        {p.status && p.status !== 'AVAILABLE' && (
          <div
            className={`absolute top-4 right-14 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow backdrop-blur-sm ${statusStyle[p.status] ?? 'bg-slate-500/90 text-white'}`}
            style={p.status === 'RESERVED' ? reservedStyle : undefined}
          >
            {getPropertyStatusLabel(p.status)}
          </div>
        )}

        {/* Save / unsave heart button */}
        <button
          onClick={handleSaveToggle}
          disabled={savePending}
          title={saved ? 'Remove from saved' : 'Save listing'}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 backdrop-blur-sm
            ${saved
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-white'}
            ${savePending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart size={15} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          {p.locality || p.city || 'Location TBA'}
        </p>
        <h3 className="font-black text-slate-900 truncate text-base leading-tight tracking-tight">{p.title || 'Unnamed Property'}</h3>

        <p className="mt-4 text-2xl font-black text-slate-900 tracking-tighter leading-none">
          ₹{p.price?.toLocaleString('en-IN') ?? '—'}
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-4 mt-4 text-xs border-t border-slate-100 pt-4">
          {p.bedrooms  != null && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <BedDouble size={12} strokeWidth={2} className="shrink-0" style={{ color: '#E9B38F' }} />
              <strong className="font-bold text-slate-700">{p.bedrooms}</strong> Beds
            </span>
          )}
          {p.bathrooms != null && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Bath size={12} strokeWidth={2} className="shrink-0" style={{ color: '#E9B38F' }} />
              <strong className="font-bold text-slate-700">{p.bathrooms}</strong> Baths
            </span>
          )}
          {p.area != null && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Maximize2 size={11} strokeWidth={2} className="shrink-0" style={{ color: '#E9B38F' }} />
              <strong className="font-bold text-slate-700">{p.area}</strong> sqft
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/properties/${p.id}`}
          className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-semibold text-sm transition-all duration-200 group/btn"
        >
          View Details
          <ArrowRight size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;