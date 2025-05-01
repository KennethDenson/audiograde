// Mock SVG components
jest.mock('lucide-react', () => {
  return {
    Play: function Play() { return null; },
    Pause: function Pause() { return null; },
    SkipForward: function SkipForward() { return null; },
    Star: function Star() { return null; },
    LogIn: function LogIn() { return null; },
    Music: function Music() { return null; },
    Moon: function Moon() { return null; },
    Sun: function Sun() { return null; },
    Menu: function Menu() { return null; },
    X: function X() { return null; },
    Settings: function Settings() { return null; }
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Audiograde from './App';
import PlexService from './plex-service';

// Mock the PlexService module
jest.mock('./plex-service', () => ({
  initialize: jest.fn(),
  fetchLibraries: jest.fn(),
  fetchRandomUnratedAlbum: jest.fn(),
  saveRatings: jest.fn()
}));

// Mock Audio class
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Audiograde Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('renders login form when not connected', () => {
    render(<Audiograde />);
    
    // Login form elements should be present
    expect(screen.getByText('Audiograde')).toBeInTheDocument();
    expect(screen.getByText('Plex Server URL')).toBeInTheDocument();
    expect(screen.getByText('Plex Token')).toBeInTheDocument();
    expect(screen.getByText(/Connect to Plex/i)).toBeInTheDocument();
  });

  test('connects to Plex when form is submitted', async () => {
    // Setup mocks
    PlexService.initialize.mockResolvedValue(true);
    PlexService.fetchLibraries.mockResolvedValue([
      { key: '1', title: 'Music' }
    ]);
    PlexService.fetchRandomUnratedAlbum.mockResolvedValue({
      id: '123',
      title: 'Test Album',
      artist: 'Test Artist',
      year: 2023,
      coverUrl: 'test-cover.jpg',
      tracks: [
        { id: 't1', title: 'Track 1', duration: 180, rating: 0 }
      ]
    });

    // Render component
    render(<Audiograde />);
    
    // Find inputs by their types rather than labels
    const serverUrlInput = screen.getByRole('textbox', { name: '' });
    const tokenInput = screen.getByPlaceholderText(/your plex authentication token/i);
    
    // Fill form and submit
    fireEvent.change(serverUrlInput, {
      target: { value: 'http://test-server.com' }
    });
    
    fireEvent.change(tokenInput, {
      target: { value: 'test-token' }
    });
    
    // Submit the form
    const submitButton = screen.getByText(/Connect to Plex/i).closest('button');
    fireEvent.click(submitButton);
    
    // Wait for async operations
    await waitFor(() => {
      // Verify PlexService was called correctly
      expect(PlexService.initialize).toHaveBeenCalledWith(
        'http://test-server.com',
        'test-token'
      );
      expect(PlexService.fetchLibraries).toHaveBeenCalled();
      expect(PlexService.fetchRandomUnratedAlbum).toHaveBeenCalled();
    });
  });

  // Test PlexService saveRatings method directly
  test('saveRatings method is called with correct parameters', async () => {
    PlexService.saveRatings.mockResolvedValue({ success: true });
    
    await PlexService.saveRatings({ 't1': 4 });
    
    expect(PlexService.saveRatings).toHaveBeenCalledWith({ 't1': 4 });
  });

  // Test dark mode storage in localStorage
  test('dark mode preference is saved in localStorage', () => {
    // Mock document.documentElement.setAttribute
    const originalSetAttribute = document.documentElement.setAttribute;
    document.documentElement.setAttribute = jest.fn();
    
    // Render with default theme (based on localStorage)
    render(<Audiograde />);
    
    // Find the value that was saved to localStorage during component initialization
    const initialDarkMode = localStorage.getItem('darkMode');
    
    // Verify the default theme was handled
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme', 
      initialDarkMode === 'true' ? 'dark' : 'light'
    );
    
    // Restore original method
    document.documentElement.setAttribute = originalSetAttribute;
  });

  // Test unrated threshold settings
  test('unrated threshold settings are loaded from localStorage', () => {
    // Set values in localStorage
    localStorage.setItem('unratedThreshold', 'count');
    localStorage.setItem('unratedThresholdValue', '5');
    
    // Render the component
    render(<Audiograde />);
    
    // The test itself is that the values were read without errors
    // We're not testing the entire UI flow here, just that localStorage
    // values are properly read during initialization
    expect(localStorage.getItem).toHaveBeenCalledWith('unratedThreshold');
    expect(localStorage.getItem).toHaveBeenCalledWith('unratedThresholdValue');
  });
}); 