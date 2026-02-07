const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = false;

// Robust worker limit to prevent memory/CPU exhaustion on EAS
config.maxWorkers = 1;

// Use custom transformer to fix import.meta issues
config.transformer.babelTransformerPath = require.resolve("./metro-transformer.js");

module.exports = withUniwindConfig(config, {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
    extraThemes: ["light", "dark"],
});
