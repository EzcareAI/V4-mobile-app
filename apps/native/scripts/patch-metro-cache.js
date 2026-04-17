/**
 * Patches metro-cache to restore the deprecated `private/stores/` path.
 *
 * uniwind's compiled metro plugin requires:
 *   require('metro-cache/private/stores/FileStore')
 *
 * But metro-cache 0.83+ moved FileStore to `src/stores/FileStore`.
 * This script creates a `private/stores/FileStore.js` shim that
 * re-exports from the correct location.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// All possible locations where metro-cache might be installed
const searchRoots = [
	path.join(__dirname, ".."),             // apps/native/
	path.join(__dirname, "..", "..", ".."),  // monorepo root
];

let patched = 0;

function patchMetroCache(metroCacheDir) {
	const srcStores = path.join(metroCacheDir, "src", "stores");
	const privateStores = path.join(metroCacheDir, "private", "stores");

	if (!fs.existsSync(srcStores)) return;
	if (fs.existsSync(path.join(privateStores, "FileStore.js"))) {
		console.log(`[patch-metro-cache] Already patched: ${metroCacheDir}`);
		return;
	}

	fs.mkdirSync(privateStores, { recursive: true });

	// Read src/stores/ and create shims for each .js file
	const files = fs.readdirSync(srcStores).filter(f => f.endsWith(".js"));
	for (const file of files) {
		const shimPath = path.join(privateStores, file);
		const relativePath = path.relative(privateStores, path.join(srcStores, file));
		const shimContent = `// Auto-generated shim — see scripts/patch-metro-cache.js\nmodule.exports = require('${relativePath.replace(/\\/g, "/")}');\n`;
		fs.writeFileSync(shimPath, shimContent, "utf8");
	}

	// Also create .d.ts shims if they exist
	const dtsFiles = fs.readdirSync(srcStores).filter(f => f.endsWith(".d.ts"));
	for (const file of dtsFiles) {
		const shimPath = path.join(privateStores, file);
		if (!fs.existsSync(shimPath)) {
			const relativePath = path.relative(privateStores, path.join(srcStores, file));
			fs.writeFileSync(shimPath, `export * from '${relativePath.replace(/\\/g, "/")}';\n`, "utf8");
		}
	}

	console.log(`[patch-metro-cache] Patched: ${metroCacheDir} (${files.length} shims)`);
	patched++;
}

for (const root of searchRoots) {
	const nodeModules = path.join(root, "node_modules");
	if (!fs.existsSync(nodeModules)) continue;

	// Direct metro-cache in node_modules/
	const directPath = path.join(nodeModules, "metro-cache");
	if (fs.existsSync(directPath)) {
		patchMetroCache(directPath);
	}

	// Bun hoisted: node_modules/.bun/metro-cache@*/node_modules/metro-cache
	const bunDir = path.join(nodeModules, ".bun");
	if (fs.existsSync(bunDir)) {
		try {
			const entries = fs.readdirSync(bunDir).filter(e => e.startsWith("metro-cache@"));
			for (const entry of entries) {
				const mcPath = path.join(bunDir, entry, "node_modules", "metro-cache");
				if (fs.existsSync(mcPath)) {
					patchMetroCache(mcPath);
				}
			}
		} catch (e) {
			console.warn(`[patch-metro-cache] Error scanning .bun dir: ${e.message}`);
		}
	}

	// Also check inside @expo/metro if it exists
	const expoMetroCache = path.join(nodeModules, "@expo", "metro", "metro-cache");
	if (fs.existsSync(expoMetroCache)) {
		patchMetroCache(expoMetroCache);
	}
}

if (patched === 0) {
	console.warn("[patch-metro-cache] No metro-cache directories needed patching.");
} else {
	console.log(`[patch-metro-cache] Done — patched ${patched} metro-cache installation(s).`);
}
