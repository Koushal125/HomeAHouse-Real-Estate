import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import BrokerVisitRequests from '../features/visits/BrokerVisitRequests';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const showToast = vi.fn();

const renderBrokerVisits = () =>
  render(
    <ToastContext.Provider value={{ showToast }}>
      <MemoryRouter>
        <BrokerVisitRequests />
      </MemoryRouter>
    </ToastContext.Provider>
  );

const makeVisit = (overrides = {}) => ({
  id: 1,
  propertyId: 100,
  propertyTitle: 'Sunrise Apartments',
  propertyCity: 'Bangalore',
  customerName: 'Alice',
  brokerName: 'Test Broker',
  visitDateTime: '2026-12-01T10:30:00',
  status: 'REQUESTED',
  notes: null,
  createdAt: '2026-04-01T09:00:00',
  ...overrides,
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('BrokerVisitRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner while fetching', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderBrokerVisits();
    expect(screen.getByText(/loading visit requests/i)).toBeInTheDocument();
  });

  it('shows error banner when fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByText(/failed to load visit requests/i)).toBeInTheDocument();
    });
  });

  it('renders visit cards with property title and customer name', async () => {
    api.get.mockResolvedValue({
      data: [
        makeVisit({ id: 1, propertyTitle: 'Sunrise Apartments', customerName: 'Alice' }),
        makeVisit({ id: 2, propertyTitle: 'Hill Top Villas', customerName: 'Bob', status: 'CONFIRMED' }),
      ],
    });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
      expect(screen.getByText('Hill Top Villas')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // ── status tab filtering ──────────────────────────────────────────────────

  it('ALL tab shows all visits', async () => {
    api.get.mockResolvedValue({
      data: [
        makeVisit({ id: 1, status: 'REQUESTED' }),
        makeVisit({ id: 2, status: 'CONFIRMED', propertyTitle: 'Hill Top' }),
        makeVisit({ id: 3, status: 'COMPLETED', propertyTitle: 'Blue Heights' }),
      ],
    });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
      expect(screen.getByText('Hill Top')).toBeInTheDocument();
      expect(screen.getByText('Blue Heights')).toBeInTheDocument();
    });
  });

  it('REQUESTED tab hides non-REQUESTED visits', async () => {
    api.get.mockResolvedValue({
      data: [
        makeVisit({ id: 1, status: 'REQUESTED', propertyTitle: 'Alpha' }),
        makeVisit({ id: 2, status: 'CONFIRMED', propertyTitle: 'Beta' }),
      ],
    });
    renderBrokerVisits();

    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /requested/i }));

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
  });

  it('CONFIRMED tab shows only CONFIRMED visits', async () => {
    api.get.mockResolvedValue({
      data: [
        makeVisit({ id: 1, status: 'REQUESTED', propertyTitle: 'Alpha' }),
        makeVisit({ id: 2, status: 'CONFIRMED', propertyTitle: 'Beta' }),
      ],
    });
    renderBrokerVisits();

    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /confirmed/i }));

    await waitFor(() => {
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });
  });

  it('shows empty state message when tab has no matching visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'REQUESTED' })] });
    renderBrokerVisits();

    await waitFor(() => expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /completed/i }));

    await waitFor(() => {
      expect(screen.getByText(/no visits in this category/i)).toBeInTheDocument();
    });
  });

  // ── Confirm action (REQUESTED → CONFIRMED) ────────────────────────────────

  it('shows Confirm and Cancel buttons for REQUESTED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 1, status: 'REQUESTED' })] });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^cancel$/i })).toHaveLength(1);
    });
  });

  it('calls PATCH with CONFIRMED status when broker clicks Confirm', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 7, status: 'REQUESTED' })] });
    api.patch.mockResolvedValue({ data: makeVisit({ id: 7, status: 'CONFIRMED' }) });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/site-visits/7/status', { status: 'CONFIRMED' });
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('confirmed'),
        'success'
      );
    });
  });

  // ── Mark Complete action (CONFIRMED → COMPLETED) ──────────────────────────

  it('shows Mark Complete and Cancel buttons for CONFIRMED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 2, status: 'CONFIRMED' })] });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^cancel$/i })).toHaveLength(1);
    });
  });

  it('calls PATCH with COMPLETED status when broker clicks Mark Complete', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 8, status: 'CONFIRMED' })] });
    api.patch.mockResolvedValue({ data: makeVisit({ id: 8, status: 'COMPLETED' }) });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/site-visits/8/status', { status: 'COMPLETED' });
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('completed'),
        'success'
      );
    });
  });

  // ── Cancel action ─────────────────────────────────────────────────────────

  it('calls PATCH with CANCELLED status when broker cancels a REQUESTED visit', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 9, status: 'REQUESTED' })] });
    api.patch.mockResolvedValue({ data: makeVisit({ id: 9, status: 'CANCELLED' }) });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^cancel$/i })).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/site-visits/9/status', { status: 'CANCELLED' });
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('shows error toast when status update fails', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 10, status: 'REQUESTED' })] });
    api.patch.mockRejectedValue({
      response: { data: { message: 'Visit no longer exists.' } },
    });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Visit no longer exists.', 'error');
    });
  });

  // ── No action buttons for terminal states ─────────────────────────────────

  it('shows no action buttons for COMPLETED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'COMPLETED' })] });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirm|mark complete|^cancel$/i })).not.toBeInTheDocument();
    });
  });

  it('shows no action buttons for CANCELLED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'CANCELLED' })] });
    renderBrokerVisits();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirm|mark complete|^cancel$/i })).not.toBeInTheDocument();
    });
  });
});
