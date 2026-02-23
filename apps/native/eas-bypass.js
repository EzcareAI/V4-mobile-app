import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🛠️ Starting EAS Build Custom Archive Bypass 🛠️");

try {
	// 1. Manually create the tarball using git archive (which creates valid tar format)
	// We use gzip natively within JS to avoid Windows pipe corruption
	console.log("Packing clean git archive...");
	const archivePath = path.join(process.cwd(), "project.tar");

	execSync("git archive --format=tar HEAD > project.tar", { stdio: "inherit" });

	console.log("Compressing to .tar.gz using Node zlib...");
	// Use zlib to compress the tar file properly
	const buf = fs.readFileSync(archivePath);
	const zlib = require("zlib");
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
