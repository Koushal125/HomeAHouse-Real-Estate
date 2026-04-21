import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import MyTransactions from '../features/transactions/MyTransactions';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

import api from '../services/api';

// ── Helper ────────────────────────────────────────────────────────────────────

const renderTransactions = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MyTransactions />
      </MemoryRouter>
    </Provider>
  );

const makeDeal = (overrides = {}) => ({
  dealId: 1,
  status: 'CLOSED',
  dealCost: 750000,
  dealDate: '2025-03-10',
  offerType: 'SELL',
  propertyTitle: 'Sunset Villas',
  propertyId: 42,
  customerName: 'Bob',
  ...overrides,
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MyTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner on first render', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderTransactions();
    expect(screen.getByText(/loading your transaction history/i)).toBeInTheDocument();
  });

  it('renders a table row for each transaction', async () => {
    api.get.mockResolvedValue({ data: [makeDeal(), makeDeal({ dealId: 2, propertyTitle: 'Hill Top' })] });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText('Sunset Villas')).toBeInTheDocument();
    expect(screen.getByText('Hill Top')).toBeInTheDocument();
  });

  it('shows rental period dates for rental deals', async () => {
    api.get.mockResolvedValue({
      data: [
        makeDeal({
          dealId: 3,
          offerType: 'RENT_LONG_TERM',
          startDate: '2025-07-01',
          endDate: '2026-06-30',
        }),
      ],
    });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    // Component renders a date-range span with an em-dash separator
    expect(screen.getByText((content) => content.includes('\u2013'))).toBeInTheDocument();
  });

  it('shows dash for rental period on sale deals', async () => {
    api.get.mockResolvedValue({ data: [makeDeal({ offerType: 'SELL' })] });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    // SELL deals have no rental period — no date-range span should be rendered
    expect(screen.queryByText((content) => content.includes('\u2013'))).not.toBeInTheDocument();
  });

  it('shows empty state message when no transactions exist', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Server error'));
    renderTransactions();

    await waitFor(() => {
      expect(screen.getByText(/failed to load your transaction history/i)).toBeInTheDocument();
    });
  });

  it('refetches when status filter changes', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    // Change the status filter (first combobox in the filter bar)
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'PENDING' } });

    await waitFor(() => {
      // api.get should have been called a second time with status param
      const calls = api.get.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      expect(calls[calls.length - 1][0]).toContain('status=PENDING');
    });
  });

  it('refetches when sort order changes', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderTransactions();

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    // Change the sort order (second combobox in the filter bar)
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '1' } });

    await waitFor(() => {
      const calls = api.get.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      expect(calls[calls.length - 1][0]).toContain('direction=ASC');
    });
  });
});
