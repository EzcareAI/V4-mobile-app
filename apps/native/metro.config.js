const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

const projectRoot = path.resolve(".");
const workspaceRoot = path.resolve(projectRoot, "../..");

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(workspaceRoot, "node_modules"),
];

// Force Metro to resolve (sub)dependencies from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

config.maxWorkers = 1;

// Workaround for "Package subpath './src/lib/TerminalReporter' is not defined by exports"
// This occurs in newer Metro versions used by @expo/cli where strict exports block deep imports
config.resolver.unstable_enablePackageExports = false;

// Add 3D model and CSS asset extensions
config.resolver.assetExts.push("glb", "gltf");
config.resolver.assetExts = config.resolver.assetExts.filter(
	(ext) => ext !== "css"
);
config.resolver.sourceExts = [...(config.resolver.sourceExts ?? []), "css"];

// Resolve the metro transformer by finding the sibling of the exported 'uniwind/metro' entry.
// We can't use require.resolve('uniwind/dist/metro/metro-transformer.cjs') directly because
// it's not listed in the package exports map. Instead, we find the directory of 'uniwind/metro'
// (which IS exported) and reference the transformer as a sibling file.
const uniwindMetroDir = path.dirname(require.resolve("uniwind/metro"));
config.transformerPath = path.join(uniwindMetroDir, "metro-transformer.cjs");

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
