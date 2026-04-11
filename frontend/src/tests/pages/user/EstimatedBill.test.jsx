import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EstimatedBill } from '../../../pages/user/EstimatedBill';
import { householdsApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  householdsApi: {
    myHouseholds: jest.fn(),
  },
}));

jest.mock('jspdf', () => ({
  jsPDF: function MockJsPdf() {
    return {
      internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
      setDrawColor: jest.fn(),
      line: jest.fn(),
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: jest.fn(),
      text: jest.fn(),
      setFillColor: jest.fn(),
      roundedRect: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
    };
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
  Receipt: () => <span data-testid="icon-receipt" />,
  Gauge: () => <span data-testid="icon-gauge" />,
  CloudSun: () => <span data-testid="icon-cloud" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  Wallet: () => <span data-testid="icon-wallet" />,
  Download: () => <span data-testid="icon-download" />,
}));

beforeEach(() => {
  householdsApi.myHouseholds.mockReset();
});

test('loads bill data and allows PDF download', async () => {
  householdsApi.myHouseholds.mockResolvedValue([
    {
      _id: 'h1',
      name: 'Alpha Home',
      predictedBill: 150,
      estimatedMonthlyLiters: 1200,
      estimatedMonthlyUnits: 12,
      climateZone: 'Wet Zone',
      location: { city: 'Kandy' },
    },
    {
      _id: 'h2',
      name: 'Beta Home',
      predictedBill: 250,
      estimatedMonthlyLiters: 1800,
      estimatedMonthlyUnits: 18,
      climateZone: 'Dry Zone',
      location: { city: 'Colombo' },
    },
  ]);

  render(<EstimatedBill />);

  await waitFor(() => {
    expect(householdsApi.myHouseholds).toHaveBeenCalledWith('user-token');
  });

  expect(await screen.findByText('Alpha Home')).toBeInTheDocument();
  expect((await screen.findAllByText('Beta Home')).length).toBeGreaterThan(0);
  expect(screen.getByText(/Total estimated monthly bill:/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));
  expect(screen.getByText(/Total estimated monthly bill:/i)).toBeInTheDocument();
});
