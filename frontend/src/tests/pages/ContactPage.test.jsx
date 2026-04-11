import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactPage } from '../../pages/ContactPage';

jest.mock('../../components/SiteShell', () => ({
  Navbar: () => <div data-testid="navbar" />,
  Footer: () => <div data-testid="footer" />,
}));

jest.mock('lucide-react', () => ({
  Clock3: () => <span data-testid="icon-clock" />,
  Mail: () => <span data-testid="icon-mail" />,
  MapPin: () => <span data-testid="icon-map" />,
  Navigation: () => <span data-testid="icon-navigation" />,
  Phone: () => <span data-testid="icon-phone" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
}));

test('renders contact page core content and form controls', () => {
  render(<ContactPage />);

  expect(screen.getByTestId('navbar')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Send us a/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('How can we help you today?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /schedule a call/i })).toBeInTheDocument();
  expect(screen.getByTestId('footer')).toBeInTheDocument();
});
