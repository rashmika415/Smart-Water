import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ManageUsers } from '../../../pages/admin/ManageUsers';
import { usersApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  usersApi: {
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));
jest.mock('lucide-react', () => new Proxy({}, { get: (_, prop) => () => <span data-testid={`icon-${String(prop)}`} /> }));

beforeEach(() => {
  usersApi.list.mockReset();
});

test('loads and shows users list', async () => {
  usersApi.list.mockResolvedValue([{ _id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'user' }]);

  render(<ManageUsers />);

  await waitFor(() => {
    expect(usersApi.list).toHaveBeenCalledWith('admin-token');
  });

  expect(screen.getByText(/Manage users/i)).toBeInTheDocument();
  expect(await screen.findByText('jane@example.com')).toBeInTheDocument();
});
