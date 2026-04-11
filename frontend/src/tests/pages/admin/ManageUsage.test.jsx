import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ManageUsage } from '../../../pages/admin/ManageUsage';
import { usageApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  usageApi: {
    adminOverview: jest.fn(),
    adminHouseholds: jest.fn(),
    adminAnomalies: jest.fn(),
    adminHouseholdDetails: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));
jest.mock('lucide-react', () => new Proxy({}, { get: (_, prop) => () => <span data-testid={`icon-${String(prop)}`} /> }));

beforeEach(() => {
  usageApi.adminOverview.mockReset();
  usageApi.adminHouseholds.mockReset();
  usageApi.adminAnomalies.mockReset();
  usageApi.adminHouseholdDetails.mockReset();
});

test('loads usage analytics datasets', async () => {
  usageApi.adminOverview.mockResolvedValue({ data: { totals: { households: 1, liters: 1000, carbonKg: 2.2 } } });
  usageApi.adminHouseholds.mockResolvedValue({ data: { rows: [{ householdId: 'h1', householdName: 'Alpha' }], total: 1, totalPages: 1, page: 1 } });
  usageApi.adminAnomalies.mockResolvedValue({ data: { rows: [] } });

  render(<ManageUsage />);

  await waitFor(() => {
    expect(usageApi.adminOverview).toHaveBeenCalledWith('admin-token', { days: 30 });
    expect(usageApi.adminHouseholds).toHaveBeenCalled();
    expect(usageApi.adminAnomalies).toHaveBeenCalledWith('admin-token', { days: 30 });
  });

  expect(screen.getByText(/Manage water usage/i)).toBeInTheDocument();
});
