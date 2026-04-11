import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

const mockUseAuth = jest.fn();
const mockCapturedPaths = [];

jest.mock(
  'react-router-dom',
  () => {
    const ReactLib = require('react');
    return {
      Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
      Route: ({ path, element, children }) => {
        if (typeof path !== 'undefined') mockCapturedPaths.push(path);
        return (
          <>
            {element || null}
            {children || null}
          </>
        );
      },
      Routes: ({ children }) => <>{children}</>,
    };
  },
  { virtual: true }
);

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../components/admin/AdminLayout', () => ({
  AdminLayout: () => <div>Admin Layout</div>,
}));

jest.mock('../components/user/UserLayout', () => ({
  UserLayout: () => <div>User Layout</div>,
}));

jest.mock('../components/admin/AdminRoute', () => ({
  AdminRoute: ({ children }) => <>{children}</>,
}));

jest.mock('../components/user/UserRoute', () => ({
  UserRoute: ({ children }) => <>{children}</>,
}));

jest.mock('../pages/LandingPage', () => ({ LandingPage: () => <div>Landing Page</div> }));
jest.mock('../pages/ContactPage', () => ({ ContactPage: () => <div>Contact Page</div> }));
jest.mock('../pages/VirtualMeterPage', () => ({ VirtualMeterPage: () => <div>Virtual Meter Page</div> }));
jest.mock('../pages/LoginPage', () => ({ LoginPage: () => <div>Login Page</div> }));
jest.mock('../pages/RegisterPage', () => ({ RegisterPage: () => <div>Register Page</div> }));
jest.mock('../pages/admin/AdminDashboard', () => () => <div>Admin Dashboard</div>);
jest.mock('../pages/admin/ManageUsers', () => ({ ManageUsers: () => <div>Manage Users</div> }));
jest.mock('../pages/admin/ManageHouseholds', () => ({ ManageHouseholds: () => <div>Manage Households</div> }));
jest.mock('../pages/admin/AllHouseholdsWithZones', () => ({ AllHouseholdsWithZones: () => <div>All Households With Zones</div> }));
jest.mock('../pages/admin/ManageActivities', () => ({ ManageActivities: () => <div>Manage Activities</div> }));
jest.mock('../pages/admin/ManageUsage', () => ({ ManageUsage: () => <div>Manage Usage</div> }));
jest.mock('../pages/admin/SavingPlaneA', () => ({ SavingPlaneA: () => <div>Admin Saving Plans</div> }));
jest.mock('../pages/user/UserDashboard', () => ({ UserDashboard: () => <div>User Dashboard</div> }));
jest.mock('../pages/user/MyProfile', () => ({ MyProfile: () => <div>My Profile</div> }));
jest.mock('../pages/user/MyHouseholds', () => ({ MyHouseholds: () => <div>My Households</div> }));
jest.mock('../pages/user/HouseholdDetails', () => ({ HouseholdDetails: () => <div>Household Details</div> }));
jest.mock('../pages/user/EstimatedBill', () => ({ EstimatedBill: () => <div>Estimated Bill</div> }));
jest.mock('../pages/user/WeatherInsights', () => ({ WeatherInsights: () => <div>Weather Insights</div> }));
jest.mock('../pages/user/SavingPlane', () => ({ SavingPlane: () => <div>Saving Plane</div> }));
jest.mock('../pages/user/ViewSavingPlane', () => ({ ViewSavingPlane: () => <div>View Saving Plane</div> }));
jest.mock('../pages/user/UserActivities', () => ({ UserActivities: () => <div>User Activities</div> }));
jest.mock('../pages/user/UsageHistory', () => ({ UsageHistory: () => <div>Usage History</div> }));
jest.mock('../pages/user/WaterActivities', () => ({ WaterActivities: () => <div>Water Activities</div> }));
jest.mock('../pages/user/CarbonAnalytics', () => ({ CarbonAnalytics: () => <div>Carbon Analytics</div> }));

beforeEach(() => {
  mockCapturedPaths.length = 0;
  mockUseAuth.mockReset();
});

test('declares all expected frontend routes', () => {
  mockUseAuth.mockReturnValue({ token: '', user: null });
  render(<App />);

  const expectedPaths = [
    '/',
    '/contact',
    '/virtual-meter',
    '/login',
    '/register',
    '/dashboard',
    '/legacy-dashboard',
    '/user',
    'profile',
    'water-activities',
    'usage',
    'carbon-analytics',
    'households',
    'households/:id',
    'estimated-bill',
    'saving-plane',
    'saving-plane/update/:planId',
    'view-saving-plane',
    'weather-insights',
    'activities',
    '/admin',
    'users',
    'households',
    'households-zones',
    'activities',
    'usage',
    'saving-plans',
    '*',
  ];

  expectedPaths.forEach((path) => {
    expect(mockCapturedPaths).toContain(path);
  });
});

test('dashboard redirect target is /login when unauthenticated', () => {
  mockUseAuth.mockReturnValue({ token: '', user: null });
  render(<App />);

  const redirectTargets = screen
    .getAllByTestId('navigate')
    .map((node) => node.getAttribute('data-to'));

  expect(redirectTargets).toContain('/login');
});

test('dashboard redirect target includes /admin for admin user', () => {
  mockUseAuth.mockReturnValue({ token: 'admin-token', user: { role: 'admin' } });
  render(<App />);

  const redirectTargets = screen
    .getAllByTestId('navigate')
    .map((node) => node.getAttribute('data-to'));

  expect(redirectTargets).toContain('/admin');
});

test('dashboard redirect target includes /user for normal user', () => {
  mockUseAuth.mockReturnValue({ token: 'user-token', user: { role: 'user' } });
  render(<App />);

  const redirectTargets = screen
    .getAllByTestId('navigate')
    .map((node) => node.getAttribute('data-to'));

  expect(redirectTargets).toContain('/user');
});
