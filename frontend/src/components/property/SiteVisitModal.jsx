import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarDays, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

const SiteVisitModal = ({ propertyId, propertyTitle, isOpen, onClose, onSuccess, anchorRef }) => {
  const { showToast } = useToast();
  const [visitDateTime, setVisitDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pos, setPos] = useState(null);
  const panelRef = useRef(null);

  const calcPos = () => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
  };

  // Recalculate position whenever modal opens
  useEffect(() => {
    if (isOpen) calcPos();
  }, [isOpen]);

  // Reposition on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => calcPos();
    const handleResize = () => calcPos();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
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

  if (!isOpen || !pos) return null;

  // Min datetime = tomorrow at current time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  const minDateTime = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!visitDateTime) {
      setError('Please select a visit date and time.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/site-visits/${propertyId}`, {
        visitDateTime: visitDateTime + ':00',
        notes: notes.trim() || null,
      });
      showToast('Visit request submitted! The broker will confirm shortly.', 'success');
      setVisitDateTime('');
      setNotes('');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit visit request. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 340), zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-100 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Schedule a Visit</h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{propertyTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Date & Time */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            <CalendarDays size={13} /> Preferred Date &amp; Time
          </label>
          <input
            type="datetime-local"
            min={minDateTime}
            value={visitDateTime}
            onChange={(e) => setVisitDateTime(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            <FileText size={13} /> Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="e.g. preferred contact number, specific rooms to see…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-black border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Submitting…' : 'Request Visit'}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default SiteVisitModal;

//   if (!isOpen) return null;

//   // Min datetime = tomorrow at current time
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
//   const pad = (n) => String(n).padStart(2, '0');
//   const minDateTime = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     if (!visitDateTime) {
//       setError('Please select a visit date and time.');
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       await api.post(`/site-visits/${propertyId}`, {
//         visitDateTime: visitDateTime + ':00',
//         notes: notes.trim() || null,
//       });
//       showToast('Visit request submitted! The broker will confirm shortly.', 'success');
//       setVisitDateTime('');
//       setNotes('');
//       onSuccess?.();
//       onClose();
//     } catch (err) {
//       const msg = err?.response?.data?.message || 'Failed to submit visit request. Please try again.';
//       setError(msg);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div
//       ref={panelRef}
//       style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width || 400, zIndex: 9999 }}
//       className="bg-white rounded-2xl shadow-2xl border border-slate-100 animate-slide-up"
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
//         <div>
//           <h2 className="text-base font-bold text-slate-900">Schedule a Visit</h2>
//           <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{propertyTitle}</p>
//         </div>
//         <button
//           onClick={onClose}
//           className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
//         >
//           <X size={16} />
//         </button>
//       </div>

//       {/* Body */}
//       <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
//         {error && (
//           <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
//             <AlertCircle size={15} className="shrink-0 mt-0.5" />
//             {error}
//           </div>
//         )}

//         {/* Date & Time */}
//         <div>
//           <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
//             <CalendarDays size={13} /> Preferred Date &amp; Time
//           </label>
//           <input
//             type="datetime-local"
//             min={minDateTime}
//             value={visitDateTime}
//             onChange={(e) => setVisitDateTime(e.target.value)}
//             required
//             className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
//           />
//         </div>

//         {/* Notes */}
//         <div>
//           <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
//             <FileText size={13} /> Notes <span className="text-slate-400 font-normal">(optional)</span>
//           </label>
//           <textarea
//             rows={3}
//             maxLength={500}
//             placeholder="e.g. preferred contact number, specific rooms to see…"
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
//           />
//         </div>

//         {/* Actions */}
//         <div className="flex gap-3 pt-1">
//           <button
//             type="button"
//             onClick={onClose}
//             className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
//           >
//             Cancel
//           </button>
//           <Button type="submit" disabled={isSubmitting} className="flex-1">
//             {isSubmitting ? 'Submitting…' : 'Request Visit'}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default SiteVisitModal;
