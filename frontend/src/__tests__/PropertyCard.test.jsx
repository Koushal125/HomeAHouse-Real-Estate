import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/features/authSlice';
import { ToastContext } from '../context/ToastContext';
import PropertyCard from '../components/property/PropertyCard';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: { post: vi.fn(), delete: vi.fn() },
}));

import api from '../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const showToast = vi.fn();

const makeStore = (isAuthenticated = false) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        isAuthenticated,
        user: isAuthenticated ? { id: 1, email: 'customer@test.com', role: 'CUSTOMER' } : null,
        token: isAuthenticated ? 'fake-token' : null,
        refreshToken: null,
      },
    },
  });

const sampleProperty = {
  propId: 1,
  title: 'Sunrise Apartments',
  city: 'Bangalore',
  offerType: 'SELL',
  status: 'AVAILABLE',
  offerCost: 500000,
  areaSqft: 1200,
};

const renderCard = (propOverrides = {}, isAuthenticated = false, initialSaved = false) => {
  const store = makeStore(isAuthenticated);
  return render(
    <Provider store={store}>
      <ToastContext.Provider value={{ showToast }}>
        <MemoryRouter>
          <PropertyCard
            property={{ ...sampleProperty, ...propOverrides }}
            initialSaved={initialSaved}
          />
        </MemoryRouter>
      </ToastContext.Provider>
    </Provider>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the property title and city', () => {
    renderCard();
    expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
    expect(screen.getByText(/bangalore/i)).toBeInTheDocument();
  });

  it('navigates to /login when unauthenticated user clicks the heart', async () => {
    renderCard({}, false);

    const heartBtn = screen.getByRole('button');
    fireEvent.click(heartBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({ replace: false })
    );
  });

  it('calls POST /favorites/:id when authenticated user saves a property', async () => {
    api.post.mockResolvedValue({});
    renderCard({}, true, false);

    const heartBtn = screen.getByRole('button');
    fireEvent.click(heartBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/favorites/1');
    });
    expect(showToast).toHaveBeenCalledWith('Saved to your listings!', 'success');
  });

  it('calls DELETE /favorites/:id when authenticated user unsaves a property', async () => {
    api.delete.mockResolvedValue({});
    renderCard({}, true, true); // initialSaved = true

    const heartBtn = screen.getByRole('button');
    fireEvent.click(heartBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/favorites/1');
    });
    expect(showToast).toHaveBeenCalledWith('Removed from saved listings', 'info');
  });

  it('shows error toast when save API call fails', async () => {
    api.post.mockRejectedValue(new Error('Network error'));
    renderCard({}, true, false);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'Could not update saved listing. Please try again.',
        'error'
      );
    });
  });

  it('renders property image when imageUrls is provided', () => {
    renderCard({ imageUrls: ['https://example.com/image.jpg'] });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders placeholder when no imageUrls are provided', () => {
    renderCard({ imageUrls: [] });
    expect(screen.getByText(/no photo available/i)).toBeInTheDocument();
  });
});
