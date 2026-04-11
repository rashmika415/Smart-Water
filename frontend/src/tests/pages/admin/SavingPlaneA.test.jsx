import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SavingPlaneA } from '../../../pages/admin/SavingPlaneA';
import { savingPlansApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  savingPlansApi: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Download: () => <span data-testid="icon-download" />,
  FileText: () => <span data-testid="icon-filetext" />,
}));

beforeEach(() => {
  savingPlansApi.getAll.mockReset();
});

test('loads and displays saving plans table', async () => {
  savingPlansApi.getAll.mockResolvedValue([
    {
      _id: 'p1',
      householdName: 'Home One',
      user: { name: 'Owner One' },
      planType: 'Basic',
      targetReductionPercentage: 10,
      priorityArea: 'General',
      waterSource: 'Municipal',
      status: 'Active',
    },
  ]);

  render(<SavingPlaneA />);

  await waitFor(() => {
    expect(savingPlansApi.getAll).toHaveBeenCalledWith('admin-token');
  });

  expect(screen.getByRole('heading', { name: 'Saving Plans' })).toBeInTheDocument();
  expect(await screen.findByText('Home One')).toBeInTheDocument();
});
