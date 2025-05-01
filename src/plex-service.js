// PlexService.js
class PlexService {
  constructor() {
    this.baseUrl = ''; // Your Plex server URL
    this.token = '';   // Your Plex authentication token
    this.headers = {
      'Accept': 'application/json',
      'X-Plex-Token': this.token
    };
    this.recentlyShownAlbums = new Set(); // Keep track of recently shown albums
  }

  async initialize(serverUrl, token) {
    this.baseUrl = serverUrl;
    this.token = token;
    this.headers['X-Plex-Token'] = token;
    
    // Test connection
    try {
      const response = await this.fetchLibraries();
      console.log('Successfully connected to Plex server');
      return true;
    } catch (error) {
      console.error('Failed to connect to Plex server:', error);
      return false;
    }
  }

  async fetchLibraries() {
    const response = await fetch(`${this.baseUrl}/library/sections`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch libraries: ${response.status}`);
    }
    
    const data = await response.json();
    return data.MediaContainer.Directory.filter(dir => dir.type === 'artist');
  }

  async fetchRandomUnratedAlbum(libraryId) {
    // First, get all albums
    const response = await fetch(`${this.baseUrl}/library/sections/${libraryId}/albums`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch albums: ${response.status}`);
    }
    
    const data = await response.json();
    const albums = data.MediaContainer.Metadata;
    
    // Shuffle the albums array first for better randomization
    const shuffledAlbums = [...albums].sort(() => Math.random() - 0.5);
    
    // Filter for albums with unrated tracks
    const unratedAlbums = [];
    let checkedAlbums = 0;
    const maxAlbumsToCheck = 50; // Only check up to 50 albums before giving up
    
    for (const album of shuffledAlbums) {
      // Break if we've checked too many albums without finding matches
      if (checkedAlbums >= maxAlbumsToCheck && unratedAlbums.length === 0) {
        break;
      }
      checkedAlbums++;
      
      // Skip if we've shown this album recently
      if (this.recentlyShownAlbums.has(album.ratingKey)) {
        continue;
      }

      const tracksResponse = await fetch(`${this.baseUrl}/library/metadata/${album.ratingKey}/children`, {
        headers: this.headers
      });
      
      if (!tracksResponse.ok) continue;
      
      const tracksData = await tracksResponse.json();
      const tracks = tracksData.MediaContainer.Metadata;
      
      // Count unrated tracks
      const unratedTracks = tracks.filter(track => track.userRating === undefined);
      const unratedCount = unratedTracks.length;
      const totalTracks = tracks.length;
      
      // Get threshold settings from localStorage
      const thresholdType = localStorage.getItem('unratedThreshold') || 'percentage';
      const thresholdValue = parseInt(localStorage.getItem('unratedThresholdValue') || '50', 10);
      
      // Validate threshold settings
      const validThresholdType = ['percentage', 'count'].includes(thresholdType) ? thresholdType : 'percentage';
      const validThresholdValue = validThresholdType === 'percentage' 
        ? Math.min(Math.max(thresholdValue, 0), 100)
        : Math.min(Math.max(thresholdValue, 1), Math.min(1000, totalTracks)); // Can't require more tracks than the album has
      
      // Check if album meets the threshold criteria
      let meetsThreshold = false;
      if (validThresholdType === 'percentage') {
        const unratedPercentage = (unratedCount / totalTracks) * 100;
        meetsThreshold = unratedPercentage >= validThresholdValue;
      } else {
        meetsThreshold = unratedCount >= validThresholdValue;
      }
      
      if (meetsThreshold) {
        unratedAlbums.push({
          id: album.ratingKey,
          title: album.title,
          artist: album.parentTitle,
          year: album.year,
          coverUrl: `${this.baseUrl}/photo/:/transcode?width=300&height=300&minSize=1&url=${encodeURIComponent(album.thumb)}&X-Plex-Token=${this.token}`,
          tracks: tracks.map(track => ({
            id: track.ratingKey,
            title: track.title,
            duration: track.duration / 1000, // Convert to seconds
            previewUrl: track.Media[0]?.Part[0]?.key ? 
              `${this.baseUrl}${track.Media[0].Part[0].key}?X-Plex-Token=${this.token}` : null,
            rating: track.userRating || 0
          }))
        });
        
        // Get more albums for better randomization
        if (unratedAlbums.length >= 25) break;
      }
    }
    
    // Select a random album from our filtered list
    if (unratedAlbums.length === 0) {
      // If no unrated albums found, clear the recently shown list and try again
      if (this.recentlyShownAlbums.size > 0) {
        this.recentlyShownAlbums.clear();
        return this.fetchRandomUnratedAlbum(libraryId);
      }
      throw new Error('No albums found matching the current criteria');
    }
    
    const selectedAlbum = unratedAlbums[Math.floor(Math.random() * unratedAlbums.length)];
    
    // Add to recently shown albums
    this.recentlyShownAlbums.add(selectedAlbum.id);
    
    // Keep only the last 50 albums in the recently shown list
    if (this.recentlyShownAlbums.size > 50) {
      const [firstItem] = this.recentlyShownAlbums;
      this.recentlyShownAlbums.delete(firstItem);
    }
    
    return selectedAlbum;
  }

  async saveRatings(trackRatings) {
    console.log('Saving ratings:', trackRatings);
    const savePromises = Object.entries(trackRatings).map(([trackId, rating]) => {
      // Convert rating from 1-5 scale to 0-10 scale that Plex uses
      const plexRating = rating * 2;
      const url = `${this.baseUrl}/:/rate?key=${trackId}&identifier=com.plexapp.plugins.library&rating=${plexRating}`;
      console.log('Saving rating to URL:', url);
      return fetch(url, {
        method: 'PUT',
        headers: this.headers
      }).then(response => {
        if (!response.ok) {
          console.error(`Failed to save rating for track ${trackId}:`, response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      });
    });
    
    const results = await Promise.all(savePromises);
    console.log('Save results:', results);
    
    // Check if all ratings were saved successfully
    const allSuccessful = results.every(response => response.ok);
    
    if (!allSuccessful) {
      throw new Error('Failed to save some ratings');
    }
    
    return { success: true };
  }

  // Helper to get a 30-second preview from a track
  async getTrackPreview(trackId, startTime = 30) {
    // This would require accessing the actual audio files
    // Plex allows this through their API if you have the right access
    return `${this.baseUrl}/library/parts/${trackId}/file?offset=${startTime}&duration=30&X-Plex-Token=${this.token}`;
  }
}

export default new PlexService();