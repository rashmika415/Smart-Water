import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CarbonAnalytics } from '../../../pages/user/CarbonAnalytics';
import { usageApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({
    token: 'user-token',
    user: { role: 'user' },
  }),
}));

jest.mock('../../../lib/api', () => ({
  usageApi: {
    carbonStats: jest.fn(),
    carbonByActivity: jest.fn(),
    carbonTrend: jest.fn(),
    carbonLeaderboard: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../components/BrandLogo', () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

jest.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="icon-refresh" />,
  ArrowUpRight: () => <span data-testid="icon-up" />,
  ArrowDownRight: () => <span data-testid="icon-down" />,
  Minus: () => <span data-testid="icon-minus" />,
  Flame: () => <span data-testid="icon-flame" />,
  BarChart3: () => <span data-testid="icon-chart" />,
  CalendarDays: () => <span data-testid="icon-calendar" />,
  Lightbulb: () => <span data-testid="icon-light" />,
  Target: () => <span data-testid="icon-target" />,
  Download: () => <span data-testid="icon-download" />,
  Printer: () => <span data-testid="icon-print" />,
}));

beforeEach(() => {
  usageApi.carbonStats.mockReset();
  usageApi.carbonByActivity.mockReset();
  usageApi.carbonTrend.mockReset();
  usageApi.carbonLeaderboard.mockReset();
  usageApi.list.mockReset();
});

test('loads carbon analytics datasets for user role', async () => {
  usageApi.carbonStats.mockResolvedValue({
    data: {
      current: { totalCarbonKg: 10, totalLiters: 1000, heatedWaterPercentage: 20 },
      comparison: { trend: 'stable', message: 'ok', carbonChange: 0 },
    },
  });
  usageApi.carbonByActivity.mockResolvedValue({
    data: { breakdown: [{ activityType: 'Shower', totalCarbonKg: 4 }] },
  });
  usageApi.carbonTrend.mockResolvedValue({
    data: { trend: [{ date: '2026-04-10', totalCarbonKg: 1.5 }] },
  });

  render(<CarbonAnalytics />);

  await waitFor(() => {
    expect(usageApi.carbonStats).toHaveBeenCalledWith('user-token', { startDate: '', endDate: '' });
    expect(usageApi.carbonByActivity).toHaveBeenCalledWith('user-token', { startDate: '', endDate: '' });
    expect(usageApi.carbonTrend).toHaveBeenCalledWith('user-token', { days: 30 });
  });

  expect(screen.getByText(/Carbon analytics/i)).toBeInTheDocument();
  expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
});
