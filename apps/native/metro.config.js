const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

config.maxWorkers = 1;

// Add 3D model and CSS asset extensions
config.resolver.assetExts.push("glb", "gltf");
config.resolver.assetExts = config.resolver.assetExts.filter(
	(ext) => ext !== "css"
);
config.resolver.sourceExts = [...(config.resolver.sourceExts ?? []), "css"];

// Use the Uniwind metro transformer (handles CSS-in-JS processing)
config.transformerPath = require.resolve(
	"uniwind/dist/metro/metro-transformer.cjs"
);
config.transformer = {
	...config.transformer,
	uniwind: {
		cssEntryFile: "./global.css",
		dtsFile: "./uniwind-types.d.ts",
		themes: ["light", "dark"],
	},
};

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

module.exports = config;
