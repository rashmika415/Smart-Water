import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HouseholdDetails } from '../../../pages/user/HouseholdDetails';
import { householdsApi } from '../../../lib/api';

jest.mock(
  'react-router-dom',
  () => ({
    useParams: () => ({ id: 'h1' }),
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    getById: jest.fn(),
    zones: jest.fn(),
    update: jest.fn(),
    createZone: jest.fn(),
  },
  zonesApi: {
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));

beforeEach(() => {
  householdsApi.getById.mockReset();
  householdsApi.zones.mockReset();
});

test('loads household details and zones', async () => {
  householdsApi.getById.mockResolvedValue({
    _id: 'h1',
    name: 'Lake House',
    propertyType: 'house',
    numberOfResidents: 4,
    estimatedMonthlyLiters: 1200,
    estimatedMonthlyUnits: 12,
    predictedBill: 400,
    climateZone: 'Wet Zone',
    location: { city: 'Kandy', state: 'Central', country: 'Sri Lanka' },
  });
  householdsApi.zones.mockResolvedValue([
    { _id: 'z1', zoneName: 'Kitchen', notes: 'Main sink' },
  ]);

  render(<HouseholdDetails />);

  await waitFor(() => {
    expect(householdsApi.getById).toHaveBeenCalledWith('user-token', 'h1');
    expect(householdsApi.zones).toHaveBeenCalledWith('user-token', 'h1');
  });

  expect(await screen.findByText(/Household details/i)).toBeInTheDocument();
  expect(screen.getByText('Lake House')).toBeInTheDocument();
  expect(screen.getByText('Kitchen')).toBeInTheDocument();
});
