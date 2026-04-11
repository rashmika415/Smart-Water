import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ManageActivities } from '../../../pages/admin/ManageActivities';
import { activitiesApi } from '../../../lib/api';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

jest.mock('../../../lib/api', () => ({
  activitiesApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../components/ui/Card', () => ({ Card: ({ children }) => <div>{children}</div> }));
jest.mock('../../../components/ui/Button', () => ({ Button: ({ children, ...rest }) => <button {...rest}>{children}</button> }));
jest.mock('lucide-react', () => new Proxy({}, { get: (_, prop) => () => <span data-testid={`icon-${String(prop)}`} /> }));

beforeEach(() => {
  activitiesApi.list.mockReset();
});

test('loads maintenance activities for admin', async () => {
  activitiesApi.list.mockResolvedValue({
    success: true,
    data: [{ _id: 'a1', activityType: 'Pipe Repair', location: 'Zone A', status: 'Pending', scheduledDate: '2026-04-11', scheduledTime: '10:00' }],
  });

  render(<ManageActivities />);

  await waitFor(() => {
    expect(activitiesApi.list).toHaveBeenCalledWith('admin-token');
  });

  expect(screen.getByText(/Maintenance Activities/i)).toBeInTheDocument();
  expect(await screen.findByText('Pipe Repair')).toBeInTheDocument();
});
