import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UsageHistory } from '../../../pages/user/UsageHistory';
import { usageApi } from '../../../lib/api';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  usageApi: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, as: As, to, ...rest }) => {
    if (As) return <As to={to} {...rest}>{children}</As>;
    return <button {...rest}>{children}</button>;
  },
}));

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  ChevronLeft: () => <span data-testid="icon-left" />,
  ChevronRight: () => <span data-testid="icon-right" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  Pencil: () => <span data-testid="icon-pencil" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Eye: () => <span data-testid="icon-eye" />,
  Droplets: () => <span data-testid="icon-droplets" />,
  Leaf: () => <span data-testid="icon-leaf" />,
  CalendarDays: () => <span data-testid="icon-calendar" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  MoreHorizontal: () => <span data-testid="icon-more" />,
}));

beforeEach(() => {
  usageApi.list.mockReset();
});

test('loads usage history list and renders activity row', async () => {
  usageApi.list.mockResolvedValue({
    data: [
      {
        _id: 'u1',
        activityType: 'Shower',
        liters: 120,
        source: 'manual',
        occurredAt: '2026-04-10T10:00:00.000Z',
        carbonFootprint: { carbonKg: 1.2 },
      },
    ],
    total: 1,
    totalPages: 1,
  });

  render(<UsageHistory />);

  await waitFor(() => {
    expect(usageApi.list).toHaveBeenCalled();
  });

  expect(screen.getByText(/Water usage history/i)).toBeInTheDocument();
  expect(await screen.findByText('Shower')).toBeInTheDocument();
});
