import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MyHouseholds } from '../../../pages/user/MyHouseholds';
import { householdsApi } from '../../../lib/api';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    myHouseholds: jest.fn(),
    create: jest.fn(),
    createZone: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, as: As, to, ...rest }) => {
    if (As) return <As to={to} {...rest}>{children}</As>;
    return <button {...rest}>{children}</button>;
  },
}));

jest.mock('lucide-react', () => ({
  Home: () => <span data-testid="icon-home" />,
  PlusCircle: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
  Trash2: () => <span data-testid="icon-trash" />,
  MapPin: () => <span data-testid="icon-map" />,
  Users: () => <span data-testid="icon-users" />,
  DollarSign: () => <span data-testid="icon-dollar" />,
  Building2: () => <span data-testid="icon-building" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
}));

beforeEach(() => {
  householdsApi.myHouseholds.mockReset();
});

test('loads households and filters by search query', async () => {
  householdsApi.myHouseholds.mockResolvedValue([
    {
      _id: 'h1',
      name: 'Lake House',
      numberOfResidents: 4,
      predictedBill: 1200,
      propertyType: 'house',
      climateZone: 'wet',
      location: { city: 'Kandy', state: 'Central', country: 'Sri Lanka' },
    },
    {
      _id: 'h2',
      name: 'City Flat',
      numberOfResidents: 2,
      predictedBill: 800,
      propertyType: 'apartment',
      climateZone: 'dry',
      location: { city: 'Colombo', state: 'Western', country: 'Sri Lanka' },
    },
  ]);

  render(<MyHouseholds />);

  await waitFor(() => {
    expect(householdsApi.myHouseholds).toHaveBeenCalledWith('user-token');
  });
  expect(await screen.findByText('Lake House')).toBeInTheDocument();
  expect(screen.getByText('City Flat')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Search households...'), {
    target: { value: 'lake' },
  });

  expect(screen.getByText('Lake House')).toBeInTheDocument();
  expect(screen.queryByText('City Flat')).not.toBeInTheDocument();
});
