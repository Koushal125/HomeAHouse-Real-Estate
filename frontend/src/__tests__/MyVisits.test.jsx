import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import MyVisits from '../features/visits/MyVisits';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const showToast = vi.fn();

const renderMyVisits = () =>
  render(
    <ToastContext.Provider value={{ showToast }}>
      <MemoryRouter>
        <MyVisits />
      </MemoryRouter>
    </ToastContext.Provider>
  );

const makeVisit = (overrides = {}) => ({
  id: 1,
  propertyId: 100,
  propertyTitle: 'Sunrise Apartments',
  propertyCity: 'Bangalore',
  brokerName: 'Test Broker',
  visitDateTime: '2026-12-01T10:30:00',
  status: 'REQUESTED',
  notes: null,
  createdAt: '2026-04-01T09:00:00',
  ...overrides,
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MyVisits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner while fetching', () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    renderMyVisits();
    expect(screen.getByText(/loading your visits/i)).toBeInTheDocument();
  });

  it('shows empty state when no visits are returned', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByText(/no visit requests yet/i)).toBeInTheDocument();
    });
  });

  it('shows error banner when fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByText(/failed to load your visit requests/i)).toBeInTheDocument();
    });
  });

  it('renders visit cards with property title and city', async () => {
    api.get.mockResolvedValue({
      data: [makeVisit(), makeVisit({ id: 2, propertyTitle: 'Hill Top Villas', propertyCity: 'Mumbai' })],
    });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
      expect(screen.getByText('Hill Top Villas')).toBeInTheDocument();
      expect(screen.getByText('Bangalore')).toBeInTheDocument();
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
    });
  });

  it('shows Cancel button for REQUESTED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'REQUESTED' })] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });
  });

  it('shows Cancel button for CONFIRMED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'CONFIRMED' })] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });
  });

  it('does NOT show Cancel button for COMPLETED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'COMPLETED' })] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
    });
  });

  it('does NOT show Cancel button for already CANCELLED visits', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ status: 'CANCELLED' })] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
    });
  });

  it('optimistically updates status to CANCELLED on successful cancel', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 5, status: 'REQUESTED' })] });
    api.delete.mockResolvedValue({});
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/site-visits/5');
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        'success'
      );
    });
    // Cancel button should disappear after status changes to CANCELLED
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
  });

  it('shows error toast when cancel API call fails', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ id: 6, status: 'REQUESTED' })] });
    api.delete.mockRejectedValue({
      response: { data: { message: 'Visit not found.' } },
    });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Visit not found.', 'error');
    });
    // Status should NOT change on failure
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('renders notes when present', async () => {
    api.get.mockResolvedValue({
      data: [makeVisit({ notes: 'Please ring the bell twice.' })],
    });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByText(/please ring the bell twice/i)).toBeInTheDocument();
    });
  });

  it('renders broker name when present', async () => {
    api.get.mockResolvedValue({ data: [makeVisit({ brokerName: 'Alice Smith' })] });
    renderMyVisits();

    await waitFor(() => {
      expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
    });
  });
});
