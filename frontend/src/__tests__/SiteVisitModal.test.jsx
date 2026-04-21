import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastContext } from '../context/ToastContext';
import SiteVisitModal from '../components/property/SiteVisitModal';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const showToast = vi.fn();

// The component positions itself relative to an anchorRef. Provide a fake DOM
// element with a mocked getBoundingClientRect so calcPos() sets pos and the
// modal actually renders during tests.
const makeAnchorRef = () => {
  const el = document.createElement('button');
  el.getBoundingClientRect = () => ({
    top: 100, bottom: 200, left: 50, right: 350, width: 300, height: 100,
  });
  document.body.appendChild(el);
  return { current: el };
};

let anchorRef;

const renderModal = (props = {}) =>
  render(
    <ToastContext.Provider value={{ showToast }}>
      <SiteVisitModal
        propertyId={42}
        propertyTitle="Sunrise Apartments"
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        anchorRef={anchorRef}
        {...props}
      />
    </ToastContext.Provider>
  );

// Build a datetime-local value that is 2 days in the future.
// Uses local time to match what the component sets as minDateTime.
const futureDatetimeLocal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('SiteVisitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    anchorRef = makeAnchorRef();
  });

  afterEach(() => {
    anchorRef.current?.remove();
  });

  it('renders the modal with property title when isOpen=true', () => {
    renderModal();
    expect(screen.getByText('Schedule a Visit')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
  });

  it('renders nothing when isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Schedule a Visit')).not.toBeInTheDocument();
  });

  it('shows validation error when submitting without a date', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));
    await waitFor(() => {
      expect(screen.getByText(/please select a visit date/i)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits with ISO-8601 datetime (appends :00 to seconds) on valid input', async () => {
    api.post.mockResolvedValue({ data: {} });
    renderModal();

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/site-visits/42',
        expect.objectContaining({
          visitDateTime: dtValue + ':00',
        })
      );
    });
  });

  it('trims notes and sends null when notes is blank', async () => {
    api.post.mockResolvedValue({ data: {} });
    renderModal();

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    // Leave notes blank — should send null
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/site-visits/42',
        expect.objectContaining({ notes: null })
      );
    });
  });

  it('sends notes text when provided', async () => {
    api.post.mockResolvedValue({ data: {} });
    renderModal();

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    fireEvent.change(screen.getByPlaceholderText(/preferred contact/i), {
      target: { value: 'Please call before arrival' },
    });
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/site-visits/42',
        expect.objectContaining({ notes: 'Please call before arrival' })
      );
    });
  });

  it('notes textarea enforces maxLength=500', () => {
    renderModal();
    const textarea = screen.getByPlaceholderText(/preferred contact/i);
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('shows a success toast and calls onSuccess after submission', async () => {
    api.post.mockResolvedValue({ data: {} });
    const onSuccess = vi.fn();
    renderModal({ onSuccess });

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Visit request submitted'),
        'success'
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('displays API error message when server returns 400 (e.g. duplicate visit)', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'You already have an active visit request for this property.' } },
    });
    renderModal();

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(screen.getByText(
        'You already have an active visit request for this property.'
      )).toBeInTheDocument();
    });
  });

  it('displays fallback error message when API response has no message field', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    renderModal();

    const dtValue = futureDatetimeLocal();
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: dtValue } });
    fireEvent.click(screen.getByRole('button', { name: /request visit/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to submit visit request/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when the Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await waitFor(() => expect(screen.getByText('Schedule a Visit')).toBeInTheDocument());
    // The component listens for mousedown outside the panel — fire it on body
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
