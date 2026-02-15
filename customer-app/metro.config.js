const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude archive folder from bundling to improve performance
// This prevents Metro from scanning the 2.6MB CSV files
config.resolver.blockList = [
  /.*\/assets\/archive\/.*\.csv$/, // Block CSV files in archive folder
];

// Also exclude from watchman (file watcher)
if (!config.watchFolders) {
  config.watchFolders = [];
}

module.exports = config;
