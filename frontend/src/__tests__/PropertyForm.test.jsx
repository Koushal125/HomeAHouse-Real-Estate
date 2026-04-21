import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PropertyForm from '../components/property/PropertyForm';

// ── helpers ───────────────────────────────────────────────────────────────────

const renderForm = (props = {}) => {
  const onSubmit = vi.fn();
  const utils = render(<PropertyForm onSubmit={onSubmit} isLoading={false} {...props} />);
  return { onSubmit, ...utils };
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('PropertyForm', () => {
  it('renders all required field labels', () => {
    renderForm();
    // Labels are plain <label> elements without htmlFor; check by text
    expect(screen.getByText('Property Name')).toBeInTheDocument();
    expect(screen.getByText('Property Configuration')).toBeInTheDocument();
    expect(screen.getByText('Offer Price (₹)')).toBeInTheDocument();
    expect(screen.getByText('Carpet Area')).toBeInTheDocument();
    expect(screen.getByText('Area Unit')).toBeInTheDocument();
    expect(screen.getByText('Area Name')).toBeInTheDocument();
    expect(screen.getByText('Locality')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('shows validation error when title is empty on submit', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /save property/i }));
    await waitFor(() => {
      expect(screen.getByText(/property name is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when price is zero or negative', async () => {
    const { container } = renderForm();
    // Price input has name="offerCost" — no htmlFor association in this form
    const priceInput = container.querySelector('input[name="offerCost"]');
    fireEvent.change(priceInput, { target: { value: '-100' } });
    fireEvent.click(screen.getByRole('button', { name: /save property/i }));
    await waitFor(() => {
      expect(screen.getByText(/offer price should be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when carpet area is empty', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /save property/i }));
    await waitFor(() => {
      expect(screen.getByText(/carpet area should be a valid number/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when city is empty on submit', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /save property/i }));
    await waitFor(() => {
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
    });
  });

  it('populates fields from initialData when editing', () => {
    renderForm({
      initialData: {
        title: 'Luxury Villa',
        configuration: '4BHK',
        propertyType: 'VILLA',
        offerType: 'SELL',
        offerCost: 1000000,
        areaSqft: 2500,
        areaUnit: 'SQ_YARDS',
        streetName: '123 Main St',
        areaName: 'Main Area',
        landmark: 'Near Metro Station',
        locality: 'Powai',
        city: 'Mumbai',
        furnished: true,
      },
    });
    expect(screen.getByDisplayValue('Luxury Villa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4BHK')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main Area')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mumbai')).toBeInTheDocument();
  });

  it('disables submit button when isLoading is true', () => {
    renderForm({ isLoading: true });
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('emits live values when fields change', async () => {
    const onValuesChange = vi.fn();
    const { container } = renderForm({ onValuesChange });

    const titleInput = container.querySelector('input[name="title"]');
    fireEvent.change(titleInput, { target: { value: 'Skyline Loft' } });

    await waitFor(() => {
      expect(onValuesChange).toHaveBeenCalled();
      expect(onValuesChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Skyline Loft',
          nearbyAmenities: [],
        })
      );
    });
  });
});
