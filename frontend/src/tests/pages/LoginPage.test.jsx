import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginPage } from '../../pages/LoginPage';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
    useLocation: () => ({ state: {} }),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  },
}));

jest.mock('lucide-react', () => ({
  Clock3: () => <span data-testid="icon-clock" />,
  Eye: () => <span data-testid="icon-eye" />,
  EyeOff: () => <span data-testid="icon-eye-off" />,
  Leaf: () => <span data-testid="icon-leaf" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

beforeEach(() => {
  mockNavigate.mockReset();
  mockLogin.mockReset();
});

test('submits credentials and navigates to dashboard on successful login', async () => {
  mockLogin.mockResolvedValueOnce({ token: 'abc' });

  render(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'secret123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
});

test('shows backend error and does not navigate when login fails', async () => {
  mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

  render(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'wrong@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'wrongpass' },
  });

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('shows fallback login error when backend error has no message', async () => {
  mockLogin.mockRejectedValueOnce({});

  render(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'fallback@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'fallbackpass' },
  });

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText('Login failed')).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('exposes expected navigation links on login page', () => {
  render(<LoginPage />);

  expect(screen.getByRole('link', { name: /SmartWater/i })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: /Create an account/i })).toHaveAttribute('href', '/register');
  expect(screen.getByRole('link', { name: /Register/i })).toHaveAttribute('href', '/register');
});
