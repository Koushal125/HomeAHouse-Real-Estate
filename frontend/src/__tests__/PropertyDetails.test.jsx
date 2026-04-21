import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PropertyDetails from '../features/property/PropertyDetails';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../components/property/TransactionModal', () => ({
  default: () => null,
}));

vi.mock('../components/property/SiteVisitModal', () => ({
  default: () => null,
}));

vi.mock('../components/property/PropertyCard', () => ({
  default: ({ property }) => <div data-testid="similar-property-card">Similar: {property.title}</div>,
}));

const authReducer = (state = { isAuthenticated: false, user: null, token: null }) => state;

const renderPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/properties/1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/my-transactions" element={<div>My Transactions</div>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('PropertyDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders similar listings for the active property', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/properties/1') {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Ocean View Apartment',
            city: 'Mumbai',
            locality: 'Powai',
            propertyType: 'APARTMENT',
            listingType: 'SELL',
            price: 10000000,
            bedrooms: 3,
            bathrooms: 2,
            area: 1500,
            status: 'AVAILABLE',
          },
        });
      }

      if (url === '/properties/search?city=Mumbai&propertyType=APARTMENT') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Ocean View Apartment',
              city: 'Mumbai',
              locality: 'Powai',
              propertyType: 'APARTMENT',
              listingType: 'SELL',
              price: 10000000,
              bedrooms: 3,
            },
            {
              id: 2,
              title: 'Powai Heights',
              city: 'Mumbai',
              locality: 'Powai',
              propertyType: 'APARTMENT',
              listingType: 'SELL',
              price: 10300000,
              bedrooms: 3,
              status: 'AVAILABLE',
            },
            {
              id: 3,
              title: 'Lakeside Residences',
              city: 'Mumbai',
              locality: 'Powai',
              propertyType: 'APARTMENT',
              listingType: 'SELL',
              price: 9800000,
              bedrooms: 3,
              status: 'AVAILABLE',
            },
          ],
        });
      }

      return Promise.resolve({ data: [] });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Similar Listings')).toBeInTheDocument();
    });

    expect(await screen.findByText('Similar: Powai Heights')).toBeInTheDocument();
    expect(screen.getByText('Similar: Lakeside Residences')).toBeInTheDocument();
    expect(screen.queryAllByTestId('similar-property-card')).toHaveLength(2);
      expect(screen.queryByText('Similar: Ocean View Apartment')).not.toBeInTheDocument();
  });
});