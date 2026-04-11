import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ManageHouseholds } from '../../../pages/admin/ManageHouseholds';
import { householdsApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));
jest.mock('lucide-react', () => new Proxy({}, { get: (_, prop) => () => <span data-testid={`icon-${String(prop)}`} /> }));

beforeEach(() => {
  householdsApi.list.mockReset();
});

test('loads and shows household list', async () => {
  householdsApi.list.mockResolvedValue({
    total: 1,
    pages: 1,
    households: [{ _id: 'h1', name: 'Alpha House', location: { city: 'Colombo' }, numberOfResidents: 4, propertyType: 'house', userId: 'u1', predictedBill: 300 }],
  });

  render(<ManageHouseholds />);

  await waitFor(() => {
    expect(householdsApi.list).toHaveBeenCalled();
  });

  expect(screen.getByText(/Manage households/i)).toBeInTheDocument();
  expect(await screen.findByText('Alpha House')).toBeInTheDocument();
});
