import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ViewSavingPlane } from '../../../pages/user/ViewSavingPlane';
import { savingPlansApi } from '../../../lib/api';

const mockNavigate = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/user/view-saving-plane', state: {} }),
  }),
  { virtual: true }
);

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  savingPlansApi: {
    getAll: jest.fn(),
    delete: jest.fn(),
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
  ArrowLeft: () => <span data-testid="icon-back" />,
}));

beforeEach(() => {
  savingPlansApi.getAll.mockReset();
  mockNavigate.mockReset();
});

test('loads and displays latest saving plan', async () => {
  savingPlansApi.getAll.mockResolvedValue([
    {
      _id: 'p1',
      planType: 'Basic',
      status: 'Active',
      targetReductionPercentage: 10,
      priorityArea: 'General',
      waterSource: 'Municipal',
      householdSize: 4,
      savingTips: ['Shorter showers'],
      savingCalculation: { totalWaterUsagePerDay: 300, targetDailyUsage: 270, waterToSaveLiters: 30 },
      weatherData: { location: 'Kandy', weather: 'Cloudy', temperature: 25, gardenAdvice: 'Water in morning' },
    },
  ]);

  render(<ViewSavingPlane />);

  await waitFor(() => {
    expect(savingPlansApi.getAll).toHaveBeenCalledWith('user-token');
  });

  expect(await screen.findByText(/View Saving Plan/i)).toBeInTheDocument();
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(screen.getByText('Shorter showers')).toBeInTheDocument();
});
