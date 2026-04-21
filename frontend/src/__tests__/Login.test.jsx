import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/features/authSlice';
import Login from '../features/auth/Login';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

import api from '../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { isAuthenticated: false, user: null, token: null, refreshToken: null },
    },
  });

const renderLogin = (initialEntries = ['/login']) => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Login />
      </MemoryRouter>
    </Provider>
  );
  return store;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('shows validation error for empty email on submit', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password on submit', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('dispatches setCredentials and navigates on successful login', async () => {
    api.post.mockResolvedValue({
      data: {
        userId: 1,
        email: 'customer@test.com',
        role: 'CUSTOMER',
        name: 'Alice',
        token: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    const store = renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'customer@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('access-token');
    });

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('shows API error message on login failure', async () => {
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });
});
