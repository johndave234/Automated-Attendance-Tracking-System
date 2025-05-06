const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for web-specific extensions
config.resolver.sourceExts = process.env.RN_SRC_EXT
  ? [...process.env.RN_SRC_EXT.split(',').concat(config.resolver.sourceExts), 'web.js', 'web.jsx', 'web.ts', 'web.tsx']
  : [...config.resolver.sourceExts, 'web.js', 'web.jsx', 'web.ts', 'web.tsx'];

// Add support for web-specific assets
config.resolver.assetExts = [...config.resolver.assetExts, 'css'];

// Add support for web entry point
config.watchFolders = [path.resolve(__dirname, 'web')];

module.exports = config; 