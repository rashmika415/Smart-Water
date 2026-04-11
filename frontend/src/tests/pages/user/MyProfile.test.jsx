import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MyProfile } from '../../../pages/user/MyProfile';
import { usersApi } from '../../../lib/api';

const mockRefreshMe = jest.fn();

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({
    token: 'user-token',
    user: {
      _id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
    },
    refreshMe: mockRefreshMe,
  }),
}));

jest.mock('../../../lib/api', () => ({
  usersApi: {
    update: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

jest.mock('lucide-react', () => ({
  UserCircle2: () => <span data-testid="icon-user" />,
  Mail: () => <span data-testid="icon-mail" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
  KeyRound: () => <span data-testid="icon-key" />,
  Save: () => <span data-testid="icon-save" />,
  BadgeCheck: () => <span data-testid="icon-badge" />,
  Fingerprint: () => <span data-testid="icon-fingerprint" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
}));

beforeEach(() => {
  usersApi.update.mockReset();
  mockRefreshMe.mockReset();
});

test('updates profile and shows success message', async () => {
  usersApi.update.mockResolvedValueOnce({ ok: true });
  mockRefreshMe.mockResolvedValueOnce({ ok: true });

  render(<MyProfile />);

  const [nameInput, emailInput] = screen.getAllByRole('textbox');
  fireEvent.change(nameInput, { target: { value: 'Alice Updated' } });
  fireEvent.change(emailInput, { target: { value: 'alice.updated@example.com' } });

  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => {
    expect(usersApi.update).toHaveBeenCalledWith('user-token', 'u1', {
      name: 'Alice Updated',
      email: 'alice.updated@example.com',
    });
  });
  expect(mockRefreshMe).toHaveBeenCalledWith('user-token');
  expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
});
