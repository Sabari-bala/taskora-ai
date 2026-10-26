import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Topbar } from '../components/layout/Topbar';
import { BrowserRouter } from 'react-router-dom';

// Mock the auth hook so we don't need a real backend
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { full_name: 'Sabari Bala', email: 'sabari@taskora.local', avatar: null },
    logout: vi.fn(),
  }),
}));

// Mock the mobile nav context
vi.mock('../components/layout/MobileNavContext', () => ({
  useMobileNav: () => ({ openNav: vi.fn() }),
}));

// MOCK THE CHILDREN: SearchBox and NotificationPanel require complex contexts
// We mock them as simple divs so the test only focuses on the Topbar itself.
vi.mock('../components/layout/SearchBox', () => ({
  SearchBox: () => <div data-testid="search-box" />,
}));
vi.mock('../components/notifications/NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />,
}));

describe('Topbar', () => {
  it('renders the user avatar, search box, and notifications', () => {
    render(
      <BrowserRouter>
        <Topbar />
      </BrowserRouter>
    );

    // Check if the user's initials are visible in the Avatar
    expect(screen.getByText('SB')).toBeInTheDocument();
    
    // Check if the mocked children rendered
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });
});
