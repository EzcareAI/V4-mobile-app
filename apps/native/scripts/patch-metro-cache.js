/**
 * Patches metro & metro-cache to restore deprecated `private/` paths that
 * uniwind's compiled metro plugin still requires:
 *   require('metro-cache/private/stores/FileStore')
 *   require('metro/private/DeltaBundler/Graph')
 *
 * Both moved to `src/...` in metro 0.83+. We create shim files under
 * `private/` that re-export from the corresponding `src/` location.
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

function shimDir(pkgDir, srcSubPath, privateSubPath, label) {
	const srcDir = path.join(pkgDir, "src", ...srcSubPath);
	const privateDir = path.join(pkgDir, "private", ...privateSubPath);

	if (!fs.existsSync(srcDir)) return 0;

	let created = 0;
	fs.mkdirSync(privateDir, { recursive: true });

	const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith(".js"));
	for (const file of jsFiles) {
		const shimPath = path.join(privateDir, file);
		if (fs.existsSync(shimPath)) continue;
		const relativePath = path.relative(privateDir, path.join(srcDir, file));
		const shimContent = `// Auto-generated shim — see scripts/patch-metro-cache.js\nmodule.exports = require('${relativePath.replace(/\\/g, "/")}');\n`;
		fs.writeFileSync(shimPath, shimContent, "utf8");
		created++;
	}

	const dtsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith(".d.ts"));
	for (const file of dtsFiles) {
		const shimPath = path.join(privateDir, file);
		if (fs.existsSync(shimPath)) continue;
		const relativePath = path.relative(privateDir, path.join(srcDir, file));
		fs.writeFileSync(shimPath, `export * from '${relativePath.replace(/\\/g, "/")}';\n`, "utf8");
	}

	if (created > 0) {
		console.log(`[patch-metro-cache] Patched ${label}: ${pkgDir} (${created} shims)`);
		patched++;
	}
	return created;
}

function patchMetroCache(metroCacheDir) {
	shimDir(metroCacheDir, ["stores"], ["stores"], "metro-cache/private/stores");
}

function patchMetro(metroDir) {
	shimDir(metroDir, ["DeltaBundler"], ["DeltaBundler"], "metro/private/DeltaBundler");
}

function patchBunHoisted(bunDir, prefix, patcher) {
	try {
		const entries = fs.readdirSync(bunDir).filter(e => e.startsWith(prefix));
		for (const entry of entries) {
			const pkgName = prefix.replace(/@$/, "");
			const pkgPath = path.join(bunDir, entry, "node_modules", pkgName);
			if (fs.existsSync(pkgPath)) patcher(pkgPath);
		}
	} catch (e) {
		console.warn(`[patch-metro-cache] Error scanning .bun for ${prefix}: ${e.message}`);
	}
}

for (const root of searchRoots) {
	const nodeModules = path.join(root, "node_modules");
	if (!fs.existsSync(nodeModules)) continue;

	// Direct installs in node_modules/
	const directMetroCache = path.join(nodeModules, "metro-cache");
	if (fs.existsSync(directMetroCache)) patchMetroCache(directMetroCache);

	const directMetro = path.join(nodeModules, "metro");
	if (fs.existsSync(directMetro)) patchMetro(directMetro);

	// Bun hoisted: node_modules/.bun/<name>@*/node_modules/<name>
	const bunDir = path.join(nodeModules, ".bun");
	if (fs.existsSync(bunDir)) {
		patchBunHoisted(bunDir, "metro-cache@", patchMetroCache);
		patchBunHoisted(bunDir, "metro@", patchMetro);
	}

	// Also check inside @expo/metro if it exists
	const expoMetroCache = path.join(nodeModules, "@expo", "metro", "metro-cache");
	if (fs.existsSync(expoMetroCache)) patchMetroCache(expoMetroCache);
	const expoMetro = path.join(nodeModules, "@expo", "metro", "metro");
	if (fs.existsSync(expoMetro)) patchMetro(expoMetro);
}

if (patched === 0) {
	console.warn("[patch-metro-cache] No metro-cache directories needed patching.");
} else {
	console.log(`[patch-metro-cache] Done — patched ${patched} metro-cache installation(s).`);
}
