# Plex Music Rater

A simple web application that helps you rate songs in your Plex Media Server library to improve your smart playlists.

## Features

- Connect directly to your Plex Media Server
- Display albums with unrated tracks
- Rate songs with a simple 5-star system
- 30-second audio previews
- Save ratings back to your Plex library

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Launch the app and enter your Plex server URL and token
2. The app will fetch a random album with unrated tracks
3. Rate the songs you want to rate
4. Click "Save Ratings" to update your Plex library
5. Click "Next Album" to move to another album

## Finding Your Plex Token

To use this app, you'll need your Plex authentication token:

1. Sign in to Plex Web App on your browser
2. Play any media file
3. Right-click anywhere and select "Inspect" or "Inspect Element"
4. Go to the Network tab in the developer tools
5. Look for requests to your Plex server
6. Find "X-Plex-Token=" in the URL of any request

## Technical Details

This app is built with:
- React
- Tailwind CSS (via CDN)
- Lucide React for icons
- Plex Media Server API

## License

MIT License