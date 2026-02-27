const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const path = require("node:path");

const config = getDefaultConfig(__dirname);

config.maxWorkers = 1;

config.resolver.assetExts.push("glb", "gltf");

// Force Metro to resolve `three` to the single singleton instance.
// This deduplicates overlapping dependencies and prevents the notorious
// "Multiple instances of Three.js" WebGL silent crash on native builds.
const threeEntry = require.resolve("three");
const THREE_PATH = threeEntry.includes("build")
	? path.resolve(path.dirname(threeEntry), "..")
	: path.dirname(threeEntry);
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === "three") {
		return context.resolveRequest(context, THREE_PATH, platform);
	}
	if (moduleName.startsWith("three/")) {
		return context.resolveRequest(
			context,
			path.join(THREE_PATH, moduleName.substring(5)),
			platform
		);
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
	cssEntryFile: "./global.css",
	dtsFile: "./uniwind-types.d.ts",
	extraThemes: ["light", "dark"],
});
