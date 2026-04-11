import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AllHouseholdsWithZones } from '../../../pages/admin/AllHouseholdsWithZones';
import { householdsApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    allWithZones: jest.fn(),
  },
}));

jest.mock('../../../components/HouseholdCard', () => ({
  HouseholdCard: ({ household, zones }) => (
    <div>
      <span>{household?.name}</span>
      <span>Zones: {zones?.length || 0}</span>
    </div>
  ),
}));

jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));

beforeEach(() => {
  householdsApi.allWithZones.mockReset();
});

test('loads households with zones cards', async () => {
  householdsApi.allWithZones.mockResolvedValue([
    { household: { _id: 'h1', name: 'Zone House' }, zones: [{ _id: 'z1' }, { _id: 'z2' }] },
  ]);

  render(<AllHouseholdsWithZones />);

  await waitFor(() => {
    expect(householdsApi.allWithZones).toHaveBeenCalledWith('admin-token');
  });

  expect(screen.getByText(/All households with zones/i)).toBeInTheDocument();
  expect(await screen.findByText('Zone House')).toBeInTheDocument();
});
