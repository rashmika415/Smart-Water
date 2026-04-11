import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SavingPlane } from '../../../pages/user/SavingPlane';
import { savingPlansApi, usageApi } from '../../../lib/api';

const mockNavigate = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  savingPlansApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  usageApi: {
    dailyWaterUsage: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, as: As, to, variant, className, ...rest }) => {
    if (As) return <As to={to} {...rest}>{children}</As>;
    return <button {...rest}>{children}</button>;
  },
}));

jest.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles" />,
  ArrowRight: () => <span data-testid="icon-right" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

beforeEach(() => {
  usageApi.dailyWaterUsage.mockReset();
  savingPlansApi.getAll.mockReset();
  mockNavigate.mockReset();
});

test('loads saving plan dependencies and renders page', async () => {
  usageApi.dailyWaterUsage.mockResolvedValue({ data: { averageDailyUsage: 220 } });
  savingPlansApi.getAll.mockResolvedValue([]);

  render(<SavingPlane />);

  await waitFor(() => {
    expect(usageApi.dailyWaterUsage).toHaveBeenCalledWith('user-token', { days: 30 });
    expect(savingPlansApi.getAll).toHaveBeenCalledWith('user-token');
  });

  expect(screen.getByText(/Saving Plane/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Generate saving plan/i })).toBeInTheDocument();
});
