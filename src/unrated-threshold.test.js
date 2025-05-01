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

describe('Unrated Threshold Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset PlexService
    PlexService.baseUrl = 'http://plex.test';
    PlexService.token = 'test-token';
    PlexService.headers = {
      'Accept': 'application/json',
      'X-Plex-Token': 'test-token'
    };
    PlexService.recentlyShownAlbums = new Set();
  });
  
  test('album with 100% unrated tracks passes percentage threshold of 50%', async () => {
    // Arrange
    const mockAlbums = [
      { ratingKey: '1', title: 'Album 1', parentTitle: 'Artist 1', year: 2023, thumb: '/thumb1' }
    ];
    
    const mockTracks = [
      { ratingKey: 't1', title: 'Track 1', duration: 180000, userRating: undefined, Media: [{ Part: [{ key: '/track1' }] }] },
      { ratingKey: 't2', title: 'Track 2', duration: 240000, userRating: undefined, Media: [{ Part: [{ key: '/track2' }] }] }
    ];
    
    // Mock fetch for albums
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockAlbums })
    });
    
    // Mock fetch for tracks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockTracks })
    });
    
    // Set threshold in localStorage
    localStorageMock.setItem('unratedThreshold', 'percentage');
    localStorageMock.setItem('unratedThresholdValue', '50');
    
    // Act
    const result = await PlexService.fetchRandomUnratedAlbum('1');
    
    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
    expect(result.tracks.length).toBe(2);
  });

  test('album with 2 unrated tracks passes count threshold of 2', async () => {
    // Arrange
    const mockAlbums = [
      { ratingKey: '1', title: 'Album 1', parentTitle: 'Artist 1', year: 2023, thumb: '/thumb1' }
    ];
    
    const mockTracks = [
      { ratingKey: 't1', title: 'Track 1', duration: 180000, userRating: undefined, Media: [{ Part: [{ key: '/track1' }] }] },
      { ratingKey: 't2', title: 'Track 2', duration: 240000, userRating: undefined, Media: [{ Part: [{ key: '/track2' }] }] },
      { ratingKey: 't3', title: 'Track 3', duration: 200000, userRating: 8, Media: [{ Part: [{ key: '/track3' }] }] }
    ];
    
    // Mock fetch for albums
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockAlbums })
    });
    
    // Mock fetch for tracks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockTracks })
    });
    
    // Set threshold in localStorage
    localStorageMock.setItem('unratedThreshold', 'count');
    localStorageMock.setItem('unratedThresholdValue', '2');
    
    // Act
    const result = await PlexService.fetchRandomUnratedAlbum('1');
    
    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
    expect(result.tracks.length).toBe(3);
  });

  test('handles invalid threshold values correctly', async () => {
    // Arrange
    const mockAlbums = [
      { ratingKey: '1', title: 'Album 1', parentTitle: 'Artist 1', year: 2023, thumb: '/thumb1' }
    ];
    
    const mockTracks = [
      { ratingKey: 't1', title: 'Track 1', duration: 180000, userRating: undefined, Media: [{ Part: [{ key: '/track1' }] }] },
      { ratingKey: 't2', title: 'Track 2', duration: 240000, userRating: undefined, Media: [{ Part: [{ key: '/track2' }] }] }
    ];
    
    // Mock fetch for albums
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockAlbums })
    });
    
    // Mock fetch for tracks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMediaContainer({ Metadata: mockTracks })
    });
    
    // Set invalid threshold values in localStorage
    localStorageMock.setItem('unratedThreshold', 'invalid-type');
    localStorageMock.setItem('unratedThresholdValue', '-10');
    
    // Act
    const result = await PlexService.fetchRandomUnratedAlbum('1');
    
    // Assert - it should still work with default values
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
    expect(result.tracks.length).toBe(2);
  });
}); 