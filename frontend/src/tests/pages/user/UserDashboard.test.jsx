import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserDashboard } from '../../../pages/user/UserDashboard';
import { householdsApi, usageApi } from '../../../lib/api';

const mockUseAuth = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    myHouseholds: jest.fn(),
  },
  usageApi: {
    dailyWaterUsage: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock('../../../components/BrandLogo', () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, as, to, ...rest }) => <button {...rest}>{children}</button>,
}));

jest.mock('../../../components/StatCard', () => ({
  StatCard: ({ title, value }) => (
    <div>
      <span>{title}</span>
      <span>{String(value)}</span>
    </div>
  ),
}));

jest.mock('lucide-react', () => ({
  Activity: () => <span data-testid="icon-activity" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
  Droplets: () => <span data-testid="icon-droplets" />,
  Gauge: () => <span data-testid="icon-gauge" />,
  Receipt: () => <span data-testid="icon-receipt" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
}));

beforeEach(() => {
  mockUseAuth.mockReset();
  householdsApi.myHouseholds.mockReset();
  usageApi.dailyWaterUsage.mockReset();
  usageApi.list.mockReset();
});

test('loads household and trend data for dashboard', async () => {
  mockUseAuth.mockReturnValue({ token: 'user-token', user: { name: 'Alice' } });
  householdsApi.myHouseholds.mockResolvedValueOnce([
    { estimatedMonthlyLiters: 1000, estimatedMonthlyUnits: 10, predictedBill: 150 },
    { estimatedMonthlyLiters: 2000, estimatedMonthlyUnits: 20, predictedBill: 250 },
  ]);
  usageApi.dailyWaterUsage.mockResolvedValueOnce({
    data: {
      trend: [
        { date: '2026-04-10', totalLiters: 100 },
        { date: '2026-04-11', totalLiters: 200 },
      ],
    },
  });

  render(<UserDashboard />);

  expect(screen.getByText(/Welcome, Alice/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(householdsApi.myHouseholds).toHaveBeenCalledWith('user-token');
    expect(usageApi.dailyWaterUsage).toHaveBeenCalledWith('user-token', { days: 7 });
  });

  await waitFor(() => {
    expect(screen.queryByText(/Loading latest household summary/i)).not.toBeInTheDocument();
  });
  expect(screen.getByText('Total households')).toBeInTheDocument();
});
