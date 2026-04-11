import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminRoute } from '../../../components/admin/AdminRoute';

const mockUseAuth = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  mockUseAuth.mockReset();
});

test('redirects non-admin users to login', () => {
  mockUseAuth.mockReturnValue({
    token: 'token-123',
    user: { role: 'user' },
    loading: false,
  });

  render(
    <AdminRoute>
      <div>Admin Content</div>
    </AdminRoute>
  );

  expect(screen.getByTestId('navigate')).toBeInTheDocument();
  expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
});

test('shows loading state while auth is loading', () => {
  mockUseAuth.mockReturnValue({
    token: '',
    user: null,
    loading: true,
  });

  render(
    <AdminRoute>
      <div>Admin Content</div>
    </AdminRoute>
  );

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
});
