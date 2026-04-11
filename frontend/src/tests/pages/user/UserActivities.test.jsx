import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserActivities } from '../../../pages/user/UserActivities';
import { activitiesApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'user-token' }),
}));

jest.mock('../../../lib/api', () => ({
  activitiesApi: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/BrandLogo', () => ({ BrandLogo: () => <span data-testid="brand-logo" /> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_, prop) => (props) => <span data-testid={`icon-${String(prop)}`} {...props} />,
}));

beforeEach(() => {
  activitiesApi.list.mockReset();
});

test('loads and displays maintenance activities', async () => {
  activitiesApi.list.mockResolvedValue({
    success: true,
    data: [
      {
        _id: 'a1234567890123456789',
        activityType: 'Pipe Damage',
        location: 'Main line',
        scheduledDate: '2026-04-12',
        scheduledTime: '10:00',
        status: 'Pending',
        notes: 'Fix leak',
      },
    ],
  });

  render(<UserActivities />);

  await waitFor(() => {
    expect(activitiesApi.list).toHaveBeenCalledWith('user-token');
  });

  expect(screen.getByText(/Maintenance Updates/i)).toBeInTheDocument();
  expect(await screen.findByText('Pipe Damage')).toBeInTheDocument();
});
