import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WeatherInsights } from '../../../pages/user/WeatherInsights';
import { householdsApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    myHouseholds: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/BrandLogo', () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

jest.mock('lucide-react', () => ({
  CloudSun: () => <span data-testid="icon-cloudsun" />,
  CloudRain: () => <span data-testid="icon-cloudrain" />,
  Sun: () => <span data-testid="icon-sun" />,
  ThermometerSun: () => <span data-testid="icon-thermo" />,
  MapPin: () => <span data-testid="icon-map" />,
  Wind: () => <span data-testid="icon-wind" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
}));

beforeEach(() => {
  householdsApi.myHouseholds.mockReset();
});

test('loads households and shows climate zone counts', async () => {
  householdsApi.myHouseholds.mockResolvedValue([
    { _id: 'h1', name: 'Dry Home', climateZone: 'Dry Zone', location: { city: 'Anuradhapura' } },
    { _id: 'h2', name: 'Wet Home', climateZone: 'Wet Zone', location: { city: 'Galle' } },
    { _id: 'h3', name: 'Mid Home', climateZone: 'Intermediate Zone', location: { city: 'Kandy' } },
  ]);

  render(<WeatherInsights />);

  await waitFor(() => {
    expect(householdsApi.myHouseholds).toHaveBeenCalledWith('user-token');
  });

  expect(await screen.findByText('Dry Home')).toBeInTheDocument();
  expect(screen.getByText('Wet Home')).toBeInTheDocument();
  expect(screen.getByText('Mid Home')).toBeInTheDocument();
  expect(screen.getByText(/Dry zone: higher estimated bill/i)).toBeInTheDocument();
  expect(screen.getByText(/Wet zone: estimated bill can be lower/i)).toBeInTheDocument();
  expect(screen.getByText(/Intermediate zone: water demand/i)).toBeInTheDocument();
});
