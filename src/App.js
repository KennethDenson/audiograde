import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Star, LogIn, Music, Moon, Sun, Menu, X, Settings } from 'lucide-react';
import PlexService from './plex-service';

// Use mock data when not connected to Plex
const mockPlexService = {
  fetchRandomUnratedAlbum: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock album data
    return {
      id: Math.floor(Math.random() * 10000),
      title: ["The Dark Side of the Moon", "Abbey Road", "Thriller", "Rumours", "OK Computer"][Math.floor(Math.random() * 5)],
      artist: ["Pink Floyd", "The Beatles", "Michael Jackson", "Fleetwood Mac", "Radiohead"][Math.floor(Math.random() * 5)],
      year: [1973, 1969, 1982, 1977, 1997][Math.floor(Math.random() * 5)],
      coverUrl: "/api/placeholder/300/300",
      tracks: Array.from({ length: 8 + Math.floor(Math.random() * 6) }, (_, i) => ({
        id: i,
        title: `Track ${i + 1}`,
        duration: 180 + Math.floor(Math.random() * 180),
        previewUrl: null,
        rating: 0
      }))
    };
  },
  
  saveRatings: async (albumId, trackRatings) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Saved ratings for album ${albumId}:`, trackRatings);
    return { success: true };
  }
};

// Format duration as MM:SS
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Audiograde() {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ratings, setRatings] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(localStorage.getItem('selectedLibrary') || null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unratedThreshold, setUnratedThreshold] = useState(
    localStorage.getItem('unratedThreshold') || 'percentage'
  );
  const [unratedThresholdValue, setUnratedThresholdValue] = useState(
    localStorage.getItem('unratedThresholdValue') || '50'
  );
  const [tempThreshold, setTempThreshold] = useState(unratedThreshold);
  const [tempThresholdValue, setTempThresholdValue] = useState(unratedThresholdValue);
  const [connectionDetails, setConnectionDetails] = useState({
    serverUrl: localStorage.getItem('plexServerUrl') || 'http://localhost:32400',
    token: localStorage.getItem('plexToken') || ''
  });
  const audioRef = useRef(null);

  useEffect(() => {
    // Check if we have saved connection details
    if (connectionDetails.serverUrl && connectionDetails.token) {
      connectToPlex();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const connectToPlex = async () => {
    setLoading(true);
    try {
      const success = await PlexService.initialize(
        connectionDetails.serverUrl,
        connectionDetails.token
      );
      
      if (success) {
        setIsConnected(true);
        localStorage.setItem('plexServerUrl', connectionDetails.serverUrl);
        localStorage.setItem('plexToken', connectionDetails.token);
        
        // Fetch music libraries
        const libs = await PlexService.fetchLibraries();
        setLibraries(libs);
        
        if (libs.length > 0) {
          let selectedLib;
          // Try to find a library named "Music"
          const musicLib = libs.find(lib => lib.title.toLowerCase() === 'music');
          const savedLib = localStorage.getItem('selectedLibrary');
          
          // Use saved library if it exists in the current libraries
          if (savedLib && libs.some(lib => lib.key === savedLib)) {
            selectedLib = savedLib;
          }
          // Otherwise use Music library if found
          else if (musicLib) {
            selectedLib = musicLib.key;
          }
          // Fall back to first library
          else {
            selectedLib = libs[0].key;
          }

          // Set the selected library
          setSelectedLibrary(selectedLib);
          localStorage.setItem('selectedLibrary', selectedLib);

          // Fetch the first album after setting up the library
          try {
            const albumData = await PlexService.fetchRandomUnratedAlbum(selectedLib);
            setAlbum(albumData);
          } catch (error) {
            console.error("Failed to fetch initial album:", error);
            alert(`Failed to fetch initial album: ${error.message}`);
          }
        }
      } else {
        alert('Failed to connect to Plex server. Please check your details.');
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert(`Connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAlbum(null);
    setLibraries([]);
    setSelectedLibrary(null);
    localStorage.removeItem('plexServerUrl');
    localStorage.removeItem('plexToken');
    localStorage.removeItem('selectedLibrary');
  };

  const fetchNewAlbum = async (libraryId = selectedLibrary) => {
    if (!libraryId) return;
    
    setLoading(true);
    setSaveSuccess(false);
    
    // Add a timeout to prevent infinite loops
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Could not find an album matching the criteria')), 10000);
    });
    
    try {
      let albumData;
      if (isConnected) {
        albumData = await Promise.race([
          PlexService.fetchRandomUnratedAlbum(libraryId),
          timeoutPromise
        ]);
      } else {
        albumData = await mockPlexService.fetchRandomUnratedAlbum();
      }
      
      setAlbum(albumData);
      setRatings({});
      setCurrentTrack(null);
      setIsPlaying(false);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    } catch (error) {
      console.error("Failed to fetch album:", error);
      
      // If we timeout, reset to default settings
      if (error.message.includes('Timeout')) {
        setUnratedThreshold('percentage');
        setUnratedThresholdValue('50');
        localStorage.setItem('unratedThreshold', 'percentage');
        localStorage.setItem('unratedThresholdValue', '50');
        alert('Could not find any albums matching these criteria. Resetting to default settings.');
        fetchNewAlbum();
        return;
      }
      
      alert(`Failed to fetch album: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveRatings = async () => {
    if (Object.keys(ratings).length === 0) return;
    
    setSaving(true);
    try {
      if (isConnected) {
        await PlexService.saveRatings(ratings);
      } else {
        await mockPlexService.saveRatings(album.id, ratings);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save ratings:", error);
      alert(`Failed to save ratings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRateTrack = async (trackId, rating) => {
    try {
      // Save rating immediately
      if (isConnected) {
        await PlexService.saveRatings({ [trackId]: rating });
        console.log(`Successfully saved rating ${rating} for track ${trackId}`);
      } else {
        await mockPlexService.saveRatings(album.id, { [trackId]: rating });
      }
      
      // Update local state after successful save
      setRatings(prev => ({
        ...prev,
        [trackId]: rating
      }));
      
      // Show brief success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1000);
    } catch (error) {
      console.error("Failed to save rating:", error);
      alert(`Failed to save rating: ${error.message}`);
    }
  };

  const togglePlayTrack = (track) => {
    if (!track.previewUrl) {
      alert('No preview available for this track');
      return;
    }
    
    if (currentTrack && currentTrack.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      setCurrentTrack(track);
      
      // Set up the audio element with the preview URL
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
      } else {
        audioRef.current.src = track.previewUrl;
      }
      
      // Play for 30 seconds only
      audioRef.current.currentTime = 0;
      
      audioRef.current.play();
      setIsPlaying(true);
      
      // Stop after 30 seconds
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, 30000);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConnectionDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Login screen
  if (!isConnected && !loading) {
    return (
      <div className="modern-card flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle absolute top-4 right-4" 
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="flex flex-col items-center justify-center w-full">
          <div className="music-icon-container mb-6">
            <Music className="music-icon" />
          </div>
          <h1 className="text-2xl font-bold mb-6 text-[var(--text-color)]">Audiograde</h1>
        </div>
        <form className="w-full space-y-4" onSubmit={(e) => {
          e.preventDefault();
          connectToPlex();
        }}>
          <div>
            <label className="block text-sm font-medium text-[var(--label-color)] mb-1">
              Plex Server URL
            </label>
            <input
              type="text"
              name="serverUrl"
              value={connectionDetails.serverUrl || "http://localhost:32400"}
              onChange={handleInputChange}
              className="login-input"
              required
            />
            <p className="mt-1 text-xs text-[var(--helper-text-color)]">
              Your local Plex address is pre-filled
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--label-color)] mb-1">
              Plex Token
            </label>
            <input
              type="password"
              name="token"
              value={connectionDetails.token}
              onChange={handleInputChange}
              placeholder="Your Plex authentication token"
              className="login-input"
              required
            />
            <p className="mt-1 text-xs text-[var(--helper-text-color)]">
              Find your token in Plex account settings
            </p>
          </div>
          <button
            type="submit"
            className="login-button"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Connect to Plex
          </button>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">How to find your Plex token:</h3>
            <ol className="mt-2 text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Sign in to Plex Web App on your browser</li>
              <li>Play any media file</li>
              <li>Right-click anywhere and select "Inspect" or "Inspect Element"</li>
              <li>Go to the Network tab in the developer tools</li>
              <li>Look for requests to your Plex server</li>
              <li>Find "X-Plex-Token=" in the URL of any request</li>
            </ol>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 p-4">
        <div className="text-xl font-semibold">Loading album...</div>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 p-4">
        <div className="text-xl font-semibold text-center">
          No album found. There might not be any unrated albums.
        </div>
        <button 
          onClick={() => fetchNewAlbum()} 
          className="modern-btn mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="modern-card">
      <div className="flex justify-between items-center absolute top-4 right-4 gap-2">
        <button onClick={() => setIsSettingsOpen(true)} className="theme-toggle" aria-label="Open settings">
          <Settings className="w-5 h-5" />
        </button>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-header">
              <h2 className="text-xl font-bold text-[var(--text-color)]">Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="settings-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="settings-content">
              <div>
                <label className="settings-label">
                  Music Library
                </label>
                <select 
                  value={selectedLibrary || ''} 
                  onChange={(e) => {
                    const newLibrary = e.target.value;
                    setSelectedLibrary(newLibrary);
                    localStorage.setItem('selectedLibrary', newLibrary);
                    fetchNewAlbum(newLibrary);
                    setIsSettingsOpen(false);
                  }}
                  className="settings-select"
                >
                  {libraries.map(lib => (
                    <option key={lib.key} value={lib.key}>{lib.title}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[var(--track-bg)] rounded-lg p-4 text-sm">
                <p className="text-[var(--text-color)] mb-3">
                  These settings control which albums show up for rating. You can either:
                </p>
                <div className="space-y-2 pl-4 text-[var(--text-secondary)]">
                  <p>• Show albums with a certain percentage of unrated tracks <span className="text-xs">(e.g., "at least 50% unrated")</span></p>
                  <p>• Show albums with a minimum number of unrated tracks <span className="text-xs">(e.g., "at least 3 unrated tracks")</span></p>
                </div>
              </div>

              <div>
                <label className="settings-label">
                  How to Choose Albums
                </label>
                <select
                  value={tempThreshold}
                  onChange={(e) => {
                    const newThreshold = e.target.value;
                    setTempThreshold(newThreshold);
                    setTempThresholdValue(newThreshold === 'percentage' ? '50' : '1');
                  }}
                  className="settings-select"
                >
                  <option value="percentage">By percentage of unrated tracks</option>
                  <option value="count">By number of unrated tracks</option>
                </select>
              </div>

              <div>
                <label className="settings-label">
                  {tempThreshold === 'percentage' 
                    ? 'Show albums with at least this percentage unrated' 
                    : 'Show albums with at least this many unrated tracks'}
                </label>
                <input
                  type="number"
                  min={tempThreshold === 'percentage' ? "0" : "1"}
                  max={tempThreshold === 'percentage' ? "100" : "1000"}
                  value={tempThresholdValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const numValue = parseInt(newValue, 10);
                    if (isNaN(numValue)) return;
                    if (tempThreshold === 'percentage') {
                      if (numValue < 0 || numValue > 100) return;
                    } else {
                      if (numValue < 1 || numValue > 1000) return;
                    }
                    setTempThresholdValue(newValue);
                  }}
                  className="settings-select"
                />
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {tempThreshold === 'percentage' 
                    ? 'Enter a value between 0 and 100' 
                    : 'Enter a value between 1 and 1000'}
                </p>
              </div>

              <button
                onClick={() => {
                  setUnratedThreshold(tempThreshold);
                  setUnratedThresholdValue(tempThresholdValue);
                  localStorage.setItem('unratedThreshold', tempThreshold);
                  localStorage.setItem('unratedThresholdValue', tempThresholdValue);
                  fetchNewAlbum();
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Save Settings
              </button>

              <button 
                onClick={() => {
                  handleDisconnect();
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Disconnect from Plex
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="album-header">
        <img 
          src={album.coverUrl} 
          alt={`${album.title} album cover`}
          className="album-art"
        />
        <div className="album-info">
          <h1 className="album-title">{album.title}</h1>
          <h2 className="artist-title">{album.artist}</h2>
          <p className="year-text">{album.year}</p>
          <div className="album-actions">
            <button 
              onClick={() => fetchNewAlbum()} 
              className="next-album-btn"
            >
              <SkipForward className="w-4 h-4" />
              Next Album
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Tracks</h3>
        <div className="space-y-2">
          {album.tracks.map((track) => (
            <div 
              key={track.id} 
              className="track-row"
            >
              <button 
                onClick={() => togglePlayTrack(track)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  track.previewUrl 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={track.previewUrl ? "Play 30 second preview" : "No preview available"}
                disabled={!track.previewUrl}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-duration">{formatDuration(track.duration)}</div>
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRateTrack(track.id, star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (ratings[track.id] || track.rating || 0) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✓ Saved
        </div>
      )}
    </div>
  );
}