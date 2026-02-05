const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle @noble/hashes subpath exports warning
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
