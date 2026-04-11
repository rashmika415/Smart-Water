import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserRoute } from '../../../components/user/UserRoute';

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

test('renders children for authenticated user role', () => {
  mockUseAuth.mockReturnValue({
    token: 'token-123',
    user: { role: 'user' },
    loading: false,
  });

  render(
    <UserRoute>
      <div>Protected User Content</div>
    </UserRoute>
  );

  expect(screen.getByText('Protected User Content')).toBeInTheDocument();
  expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
});

test('shows loading state while auth is loading', () => {
  mockUseAuth.mockReturnValue({
    token: '',
    user: null,
    loading: true,
  });

  render(
    <UserRoute>
      <div>Protected User Content</div>
    </UserRoute>
  );

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
});
