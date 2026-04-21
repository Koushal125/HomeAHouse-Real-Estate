import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/features/authSlice';
import ProtectedRoute from '../components/common/ProtectedRouteFile';

// ── helpers ───────────────────────────────────────────────────────────────────

const makeStore = (overrides = {}) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        ...overrides,
      },
    },
  });

// Renders the router tree and returns what the current page shows
const renderWithAuth = (authState, allowedRoles) => {
  const store = makeStore(authState);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard/customer" element={<div>Customer Dashboard</div>} />
          <Route path="/dashboard/broker" element={<div>Broker Dashboard</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithAuth({ isAuthenticated: false, user: null, token: null }, ['CUSTOMER']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders content for authenticated user with correct role', () => {
    renderWithAuth(
      { isAuthenticated: true, user: { role: 'CUSTOMER' }, token: 'tok' },
      ['CUSTOMER']
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects BROKER to broker dashboard when accessing a CUSTOMER-only route', () => {
    renderWithAuth(
      { isAuthenticated: true, user: { role: 'BROKER' }, token: 'tok' },
      ['CUSTOMER']
    );
    expect(screen.getByText('Broker Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects CUSTOMER to customer dashboard when accessing a BROKER-only route', () => {
    renderWithAuth(
      { isAuthenticated: true, user: { role: 'CUSTOMER' }, token: 'tok' },
      ['BROKER']
    );
    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows both CUSTOMER and BROKER when multiple roles are specified', () => {
    renderWithAuth(
      { isAuthenticated: true, user: { role: 'BROKER' }, token: 'tok' },
      ['CUSTOMER', 'BROKER']
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
