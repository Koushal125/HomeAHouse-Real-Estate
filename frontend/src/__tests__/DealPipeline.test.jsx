import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import DealPipeline from '../features/transactions/DealPipeline';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';

// ── Helper ────────────────────────────────────────────────────────────────────

const showToast = vi.fn();

const renderPipeline = () =>
  render(
    <ToastContext.Provider value={{ showToast }}>
      <MemoryRouter>
        <DealPipeline />
      </MemoryRouter>
    </ToastContext.Provider>
  );

const makeDeal = (overrides = {}) => ({
  dealId: 1,
  status: 'PENDING',
  dealCost: 500000,
  dealDate: '2025-01-15',
  offerType: 'SELL',
  propertyTitle: 'Sunrise Apartments',
  customerName: 'Alice',
  ...overrides,
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DealPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    renderPipeline();
    expect(screen.getByText(/loading your pipeline/i)).toBeInTheDocument();
  });

  it('buckets PENDING deals into the Pending column', async () => {
    api.get.mockResolvedValue({ data: [makeDeal({ dealId: 1, status: 'PENDING' })] });
    renderPipeline();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
    // Advance button should be visible for PENDING deals
    expect(screen.getByRole('button', { name: /move to under contract/i })).toBeInTheDocument();
  });

  it('buckets UNDER_CONTRACT deals into the Under Contract column', async () => {
    api.get.mockResolvedValue({
      data: [makeDeal({ dealId: 2, status: 'UNDER_CONTRACT', propertyTitle: 'Green Valley' })],
    });
    renderPipeline();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText('Green Valley')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark as closed/i })).toBeInTheDocument();
  });

  it('buckets CLOSED deals into the Closed column with no advance button', async () => {
    api.get.mockResolvedValue({
      data: [makeDeal({ dealId: 3, status: 'CLOSED', propertyTitle: 'Blue Heights' })],
    });
    renderPipeline();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText('Blue Heights')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /move to|mark as/i })).not.toBeInTheDocument();
  });

  it('shows deals with no status in the Closed column', async () => {
    api.get.mockResolvedValue({
      data: [makeDeal({ dealId: 4, status: null, propertyTitle: 'Old Deal' })],
    });
    renderPipeline();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText('Old Deal')).toBeInTheDocument();
  });

  it('advances a PENDING deal to UNDER_CONTRACT on button click', async () => {
    api.get.mockResolvedValue({ data: [makeDeal({ dealId: 5, status: 'PENDING' })] });
    api.patch.mockResolvedValue({ data: makeDeal({ dealId: 5, status: 'UNDER_CONTRACT' }) });

    renderPipeline();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /move to under contract/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/deals/5/advance');
    });
  });

  it('shows error message when pipeline fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderPipeline();

    await waitFor(() => {
      expect(screen.getByText(/failed to load your deal pipeline/i)).toBeInTheDocument();
    });
  });

  it('renders rental dates on rental deal cards', async () => {
    api.get.mockResolvedValue({
      data: [
        makeDeal({
          dealId: 6,
          status: 'PENDING',
          offerType: 'RENT_LONG_TERM',
          startDate: '2025-06-01',
          endDate: '2026-05-31',
        }),
      ],
    });
    renderPipeline();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    // Rental period dates should appear in the card
    expect(screen.getByText(/6\/1\/2025/i)).toBeInTheDocument();
  });
});
