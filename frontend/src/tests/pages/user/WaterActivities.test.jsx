import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WaterActivities } from '../../../pages/user/WaterActivities';
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
    create: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, as: As, to, variant, className, ...rest }) => {
    if (As) return <As to={to} {...rest}>{children}</As>;
    return <button {...rest}>{children}</button>;
  },
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_, prop) => (props) => <span data-testid={`icon-${String(prop)}`} {...props} />,
}));

beforeEach(() => {
  usageApi.list.mockReset();
});

test('loads and renders water activities page with records', async () => {
  usageApi.list.mockResolvedValue({
    data: [
      {
        _id: 'u1',
        activityType: 'Shower',
        liters: 100,
        source: 'manual',
        occurredAt: '2026-04-11T10:00:00.000Z',
      },
    ],
  });

  render(<WaterActivities />);

  await waitFor(() => {
    expect(usageApi.list).toHaveBeenCalledWith('user-token', { page: 1, limit: 8, sort: '-occurredAt' });
  });

  expect(screen.getByText(/Water activities/i)).toBeInTheDocument();
  expect(await screen.findByText('Shower')).toBeInTheDocument();
});
