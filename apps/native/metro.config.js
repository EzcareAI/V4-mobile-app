const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

let config = getDefaultConfig(__dirname);

// Apply Uniwind first
config = withUniwindConfig(config, {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
    extraThemes: ["light", "dark"],
});

// Manual overrides AFTER Uniwind to ensure they take priority
config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = false;

// Robust worker limit to prevent memory/CPU exhaustion on EAS
config.maxWorkers = 1;

// Use custom transformer to fix import.meta issues
config.transformer.babelTransformerPath = require.resolve("./metro-transformer.js");

module.exports = config;
