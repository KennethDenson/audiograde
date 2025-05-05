# Audiograde

A modern web application that helps you rate unrated music tracks in your Plex Media Server library. Find and rate albums with unrated tracks to enhance your music collection metadata.

## Features

<img src="public/logo.png" alt="Audiograde Logo" width="100" align="right" style="margin-left: 20px; margin-bottom: 10px;" />

- 🎵 Browse albums with unrated tracks in your Plex music library
- ⭐ Rate tracks directly through an intuitive interface
- 🎧 Preview tracks (if available in your Plex setup)
- 🌙 Dark/light theme toggle for comfortable viewing
- ⚙️ Customizable album selection criteria:
  - Select albums by percentage of unrated tracks
  - Select albums by number of unrated tracks
- 🔄 Easy navigation between albums
- 🔒 Your Plex token stays in your browser (localStorage)

## Screenshots

### Desktop View
<img src="screenshots/desktop.png" alt="Desktop View" width="100%"/>

### Mobile Views
<p align="center">
  <img src="screenshots/setup.png" alt="Setup Screen" width="32%" />
  <img src="screenshots/setup-dark.png" alt="Setup Dark Mode" width="32%" />
  <img src="screenshots/rating.png" alt="Rating Screen" width="32%" />
</p>

## Prerequisites

Before you begin, ensure you have the following:

1. **Plex Media Server**: Running and accessible on your network
2. **Music Library**: Set up in your Plex Media Server
3. **Plex Account**: You need to be signed into your Plex account
4. **Node.js**: Version 14.x or higher (for development only)
5. **npm**: Latest version (for development only)
6. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

## Installation

### For Users (Running the Pre-built App)

1. Download the latest release from the [releases page](https://github.com/yourusername/audiograde/releases)
2. Extract the ZIP file to a directory of your choice
3. Open the `index.html` file in your web browser
   - Alternatively, you can host these files on any web server

### For Developers (Running from Source)

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/audiograde.git
   cd audiograde
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm start
   ```
4. The application will open in your default browser at `http://localhost:3000`

### Building for Production

To create an optimized production build:

```
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Obtaining Your Plex Token

To use this application, you'll need your Plex token. Here's how to find it:

### Method 1: Using Browser Developer Tools

1. Sign in to the Plex Web App ([app.plex.tv](https://app.plex.tv))
2. Play any media file
3. Right-click anywhere and select "Inspect" or "Inspect Element"
4. Go to the "Network" tab in the developer tools
5. Refresh the page
6. Look for any request to your Plex server
7. Find the `X-Plex-Token` parameter in the URL
   - It will look something like `?X-Plex-Token=abcdef123456789`

### Method 2: Using Plex Settings (XML Method)

1. Sign in to the Plex Web App ([app.plex.tv](https://app.plex.tv))
2. Click on the settings icon (top right)
3. Select any server from the left sidebar
4. Add `/manage` to the end of the URL in your browser's address bar and press Enter
5. You'll be redirected to the server management interface
6. Click the three dots menu (⋮) at the top right
7. Choose "View XML"
8. In the URL of the XML page, you'll find `X-Plex-Token=` followed by your token

## Finding Your Plex Server URL

1. **Local Access**: 
   - Your Plex server typically runs on port 32400
   - The URL format is usually `http://IP_ADDRESS:32400`
   - Example: `http://192.168.1.100:32400`
2. **Remote Access**: 
   - If you have remote access enabled, you can use `https://your-server-name.plex.direct:32400`
   - Note that remote access requires additional security considerations

## Usage

### Connecting to Plex

1. Launch the application
2. Enter your Plex server URL (e.g., `http://192.168.1.100:32400`)
3. Enter your Plex authentication token
4. Click "Connect to Plex"

### Rating Albums

1. Once connected, the app shows an album with unrated tracks
2. Click on the stars (1-5) next to each track to rate it
3. Ratings are saved automatically
4. Click "Next Album" to load another album with unrated tracks

### Customizing Album Selection

1. Click the gear icon in the top right to open Settings
2. Choose your music library if you have multiple
3. Select how to filter albums:
   - By percentage of unrated tracks (e.g., show albums with at least 50% unrated tracks)
   - By count of unrated tracks (e.g., show albums with at least 3 unrated tracks)
4. Click "Save Settings" to apply your changes

### Resetting the App

If you need to reset your settings or change your Plex server:
1. Navigate to `/reset.html` in your browser
2. Click "Reset All Settings"
3. You'll be returned to the login screen

## Troubleshooting

### Connection Issues

1. **"Failed to connect to Plex server"**
   - Verify your server URL is correct
   - Ensure your Plex server is running
   - Check if your token is valid and hasn't expired
2. **CORS Errors**
   - If using a hosted version, ensure your Plex server has appropriate CORS headers enabled
   - For local development, CORS issues are typically handled by the development server

### No Albums Found

1. **"No album found. There might not be any unrated albums."**
   - Adjust the threshold settings to be less restrictive
   - Check if you have any unrated tracks in your library
   - Verify you're connected to the correct library

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/audiograde/issues) for similar problems
2. Create a new issue with detailed information about your problem
3. Include your browser and operating system details when reporting issues

## Security Notes

- This application stores your Plex token in your browser's localStorage
- Always use this application on a secure device and network
- Consider removing the token from localStorage when you're done using the app
- Never share your Plex token with others

## Technical Details

### Stack

- React for the user interface
- Jest and React Testing Library for testing
- CSS3 with CSS variables for theming
- Lucide React for icons

### Architecture

- `PlexService.js` - Service for interacting with the Plex API
- `App.js` - Main React component
- Local storage for persisting user preferences and connection details

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Plex](https://www.plex.tv/) for their amazing media server
- [Lucide Icons](https://lucide.dev/) for the beautiful icons
- All contributors and users of this application

---

Made with ♥ for music lovers who organize their collections with Plex 