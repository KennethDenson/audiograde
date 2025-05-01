import PlexService from './plex-service';

// Create a real-looking MediaContainer response
const createMediaContainer = (data) => ({
  MediaContainer: data
});

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

// Mock fetch API
global.fetch = jest.fn();

describe('PlexService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset PlexService state
    PlexService.baseUrl = '';
    PlexService.token = '';
    PlexService.headers = {
      'Accept': 'application/json',
      'X-Plex-Token': ''
    };
    PlexService.recentlyShownAlbums = new Set();
  });

  test('initial state is empty', () => {
    expect(PlexService.baseUrl).toBe('');
    expect(PlexService.token).toBe('');
    expect(PlexService.headers['X-Plex-Token']).toBe('');
    expect(PlexService.recentlyShownAlbums.size).toBe(0);
  });

  test('initialize should set server URL and token', async () => {
    // Mock successful response for fetchLibraries
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ 
        Directory: [{ type: 'artist', key: '1', title: 'Music' }] 
      })
    });

    const result = await PlexService.initialize('http://plex.test', 'test-token');
    
    expect(result).toBe(true);
    expect(PlexService.baseUrl).toBe('http://plex.test');
    expect(PlexService.token).toBe('test-token');
    expect(PlexService.headers['X-Plex-Token']).toBe('test-token');
    expect(fetch).toHaveBeenCalledWith(
      'http://plex.test/library/sections',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Plex-Token': 'test-token'
        })
      })
    );
  });

  test('initialize should return false when connection fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Connection failed'));

    const result = await PlexService.initialize('http://plex.test', 'test-token');
    
    expect(result).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('fetchLibraries should return music libraries', async () => {
    // Setup
    PlexService.baseUrl = 'http://plex.test';
    PlexService.token = 'test-token';
    
    // Mock response
    const mockLibraries = [
      { type: 'artist', key: '1', title: 'Music' },
      { type: 'movie', key: '2', title: 'Movies' },
      { type: 'artist', key: '3', title: 'Classical Music' }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Directory: mockLibraries })
    });

    // Execute
    const result = await PlexService.fetchLibraries();
    
    // Verify
    expect(fetch).toHaveBeenCalledWith('http://plex.test/library/sections', {
      headers: PlexService.headers
    });
    expect(result).toHaveLength(2); // Should only include artist libraries
    expect(result[0]).toEqual(mockLibraries[0]);
    expect(result[1]).toEqual(mockLibraries[2]);
  });

  test('saveRatings should call Plex API for each rating', async () => {
    // Setup
    PlexService.baseUrl = 'http://plex.test';
    PlexService.token = 'test-token';
    
    const trackRatings = {
      '123': 4,
      '456': 2
    };
    
    fetch.mockResolvedValue({
      ok: true
    });

    // Execute
    await PlexService.saveRatings(trackRatings);
    
    // Verify
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      'http://plex.test/:/rate?key=123&identifier=com.plexapp.plugins.library&rating=8',
      expect.objectContaining({ 
        method: 'PUT',
        headers: PlexService.headers 
      })
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://plex.test/:/rate?key=456&identifier=com.plexapp.plugins.library&rating=4',
      expect.objectContaining({ 
        method: 'PUT',
        headers: PlexService.headers 
      })
    );
  });

  test('fetchRandomUnratedAlbum should handle errors gracefully', async () => {
    // Setup
    PlexService.baseUrl = 'http://plex.test';
    PlexService.token = 'test-token';
    
    // Mock a failed fetch response
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Execute and verify
    await expect(PlexService.fetchRandomUnratedAlbum('1')).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledWith(
      'http://plex.test/library/sections/1/albums',
      expect.objectContaining({
        headers: PlexService.headers
      })
    );
  });
}); 