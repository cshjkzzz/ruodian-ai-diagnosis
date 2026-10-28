const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// The API and app share explicitly labeled demo fixtures outside mobile/.
config.watchFolders = [path.resolve(__dirname, "..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
