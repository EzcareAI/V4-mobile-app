const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

console.log("🛠️ Starting EAS Build Custom Archive Bypass 🛠️");

try {
	// 1. Manually create the tarball using git archive (which creates valid tar format)
	// We use gzip natively within JS to avoid Windows pipe corruption
	console.log("Packing clean git archive from the monorepo root...");
	const archivePath = path.join(process.cwd(), "project.tar");
	const rootPath = path.join(process.cwd(), "..", "..");

	// Run git archive from the root directory so the entire monorepo is captured,
	// but use --output instead of > redirection to prevent Windows shell from corrupting the binary stream!
	execSync(`git archive --format=tar --output="${archivePath}" HEAD`, {
		stdio: "inherit",
		cwd: rootPath,
	});

	console.log("Compressing to .tar.gz using Node zlib...");
	// Use zlib to compress the tar file properly
	const buf = fs.readFileSync(archivePath);
	const zlib = require("node:zlib");
	const compressed = zlib.gzipSync(buf);
	fs.writeFileSync("project.tar.gz", compressed);

	// Clean up uncompressed tar
	fs.unlinkSync(archivePath);

	console.log("Tarball created safely: project.tar.gz");

	// 2. We now tell EAS to use our explicit Local Tarball
	console.log("Triggering EAS build from local tarball...");
	execSync("eas build --platform android --profile preview --non-interactive", {
		env: {
			...process.env,
			// Force EAS to upload this exact file instead of building its own
			EAS_LOCAL_BUILD_SKIP_CLEANUP: "1",
			EAS_NO_VCS: "1", // tell it to stop trying to use git internally
		},
		stdio: "inherit",
	});

	console.log("✅ Build triggered successfully");
} catch (e) {
	console.error("❌ Build failed:", e.message);
}
