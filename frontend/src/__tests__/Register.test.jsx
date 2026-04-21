import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import Register from '../features/auth/Register';

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

// ── Helper ────────────────────────────────────────────────────────────────────

const renderRegister = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </Provider>
  );

const fillForm = ({
  name = 'Alice Smith',
  email = 'alice@test.com',
  phone = '9876543210',
  password = 'secret123',
  confirmPassword = 'secret123',
} = {}) => {
  fireEvent.change(screen.getByPlaceholderText(/john smith/i), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText(/\+91 98765/i), { target: { value: phone } });
  // Password fields share the same placeholder pattern; grab both inputs by name attribute
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (passwordInputs[0]) fireEvent.change(passwordInputs[0], { target: { value: password } });
  if (passwordInputs[1]) fireEvent.change(passwordInputs[1], { target: { value: confirmPassword } });
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, email, phone and password fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/john smith/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+91 98765/i)).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when email is invalid', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password is too short', async () => {
    renderRegister();
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs[0]) fireEvent.change(passwordInputs[0], { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    renderRegister();
    fillForm({ password: 'password123', confirmPassword: 'different456' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it('navigates to /login with success message on successful registration', async () => {
    api.post.mockResolvedValue({});
    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        email: 'alice@test.com',
      }));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login',
        expect.objectContaining({
          state: expect.objectContaining({ message: expect.stringContaining('successful') }),
        })
      );
    });
  });

  it('shows API error message on registration failure', async () => {
    api.post.mockRejectedValue({
      response: { status: 409, data: { message: 'Email already registered' } },
    });

    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument();
    });
  });
});
