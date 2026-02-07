const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = false;

// Limit workers to prevent memory exhaustion on EAS Cloud
config.maxWorkers = 2;

module.exports = withUniwindConfig(config, {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
    extraThemes: ["light", "dark"],
});
