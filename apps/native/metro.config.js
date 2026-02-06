const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Disable React Compiler for web to avoid module loading issues
config.resolver.disableHierarchicalLookup = false;

module.exports = withUniwindConfig(config, {
	cssEntryFile: "./global.css",
	dtsFile: "./uniwind-types.d.ts",
	extraThemes: ["light", "dark"],
});
