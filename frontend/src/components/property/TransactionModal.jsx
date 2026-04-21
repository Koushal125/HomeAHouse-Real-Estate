import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { getOfferActionLabel } from '../../utils/enums';
import { normalizeProperty } from '../../utils/normalizers';

const TransactionModal = ({ isOpen, onClose, property, onSuccess, anchorRef }) => {
  const normalizedProperty = normalizeProperty(property);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pos, setPos] = useState(null);
  const panelRef = useRef(null);

  const calcPos = () => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 320) });
    }
  };

  useEffect(() => {
    if (isOpen) calcPos();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => calcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, anchorRef]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !normalizedProperty || !pos) return null;

  const handleTransaction = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post(`/deals/${normalizedProperty.id}`);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const actionText = getOfferActionLabel(normalizedProperty.listingType);

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="bg-white rounded-[28px] shadow-2xl border border-slate-100 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">Confirm {actionText}</h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{normalizedProperty.title}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleTransaction} className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
          <IndianRupee size={18} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asking Price</p>
            <p className="text-lg font-black text-slate-900 tracking-tight">₹{normalizedProperty.price?.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          This will initiate the deal at the listed price. The broker will be notified to proceed.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-sm font-black border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 text-sm font-black text-slate-900 rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#E9B38F' }}
          >
            {isLoading ? 'Processing…' : `Confirm ${actionText}`}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default TransactionModal;