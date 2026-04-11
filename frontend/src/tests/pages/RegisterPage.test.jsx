import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegisterPage } from '../../pages/RegisterPage';

const mockNavigate = jest.fn();
const mockRegister = jest.fn();
const mockLogin = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
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
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Target: () => <span data-testid="icon-target" />,
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    login: mockLogin,
  }),
}));

beforeEach(() => {
  mockNavigate.mockReset();
  mockRegister.mockReset();
  mockLogin.mockReset();
});

test('registers user then logs in and navigates to dashboard', async () => {
  mockRegister.mockResolvedValueOnce({ ok: true });
  mockLogin.mockResolvedValueOnce({ token: 'abc' });

  render(<RegisterPage />);

  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { value: 'Test User' },
  });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
    target: { value: 'secret123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'secret123',
      role: 'user',
    });
  });

  expect(mockLogin).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'secret123',
  });
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
});

test('shows backend error when registration fails', async () => {
  mockRegister.mockRejectedValueOnce(new Error('Email already exists'));

  render(<RegisterPage />);

  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { value: 'Test User' },
  });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'taken@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
    target: { value: 'secret123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('toggles password visibility in register form', () => {
  render(<RegisterPage />);

  const passwordInput = screen.getByPlaceholderText('At least 6 characters');
  expect(passwordInput).toHaveAttribute('type', 'password');

  fireEvent.click(screen.getByRole('button', { name: /show password/i }));
  expect(passwordInput).toHaveAttribute('type', 'text');

  fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
  expect(passwordInput).toHaveAttribute('type', 'password');
});

test('shows fallback registration error when backend error has no message', async () => {
  mockRegister.mockRejectedValueOnce({});

  render(<RegisterPage />);

  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { value: 'Test User' },
  });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'fallback@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
    target: { value: 'secret123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('exposes expected navigation links and password rules on register page', () => {
  render(<RegisterPage />);

  expect(screen.getByRole('link', { name: /SmartWater/i })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: /Login/i })).toHaveAttribute('href', '/login');
  expect(screen.getByPlaceholderText('At least 6 characters')).toHaveAttribute('minLength', '6');
});
