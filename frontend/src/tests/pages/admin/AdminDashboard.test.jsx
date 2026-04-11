import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import { householdsApi, usersApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    list: jest.fn(),
    allWithZones: jest.fn(),
  },
  usersApi: {
    list: jest.fn(),
  },
}));

jest.mock('../../../components/BrandLogo', () => ({ BrandLogo: () => <span data-testid="brand-logo" /> }));
jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('lucide-react', () => new Proxy({}, { get: (_, prop) => () => <span data-testid={`icon-${String(prop)}`} /> }));

beforeEach(() => {
  usersApi.list.mockReset();
  householdsApi.list.mockReset();
  householdsApi.allWithZones.mockReset();
});

test('loads admin dashboard data', async () => {
  usersApi.list.mockResolvedValue([{ _id: 'u1', name: 'Admin', role: 'admin' }]);
  householdsApi.list.mockResolvedValue({ households: [{ _id: 'h1', name: 'House A', predictedBill: 120 }] });
  householdsApi.allWithZones.mockResolvedValue([{ household: { _id: 'h1' }, zones: [{ _id: 'z1' }] }]);

  render(<AdminDashboard />);

  await waitFor(() => {
    expect(usersApi.list).toHaveBeenCalledWith('admin-token');
    expect(householdsApi.list).toHaveBeenCalledWith('admin-token', { page: 1, limit: 500, search: '' });
    expect(householdsApi.allWithZones).toHaveBeenCalledWith('admin-token');
  });

  expect(screen.getByText(/Smart Water Command Center/i)).toBeInTheDocument();
});
