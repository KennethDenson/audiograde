// Script to reset app settings by clearing localStorage
console.log('Resetting Plex Music Rater settings...');

// List of keys to remove from localStorage
const keysToRemove = [
  'plexServerUrl',
  'plexToken',
  'selectedLibrary',
  'darkMode',
  'unratedThreshold',
  'unratedThresholdValue'
];

// Remove each key
keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log('All settings have been reset. You can now log in from scratch.'); 