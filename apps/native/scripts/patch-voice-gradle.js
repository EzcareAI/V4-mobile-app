const fs = require("node:fs");
const path = require("node:path");

const filePaths = [
	path.join(
		__dirname,
		"../node_modules/@react-native-voice/voice/android/build.gradle"
	),
	path.join(
		__dirname,
		"../../../node_modules/@react-native-voice/voice/android/build.gradle"
	),
];

let filePatched = false;

for (const filePath of filePaths) {
	if (fs.existsSync(filePath)) {
		console.log(`[patch-voice-gradle] Found build.gradle at ${filePath}`);
		let content = fs.readFileSync(filePath, "utf8");

		if (content.includes("com.android.support:appcompat-v7")) {
			content = content.replace(
				/implementation ['"]com\.android\.support:appcompat-v7:.*\n?/g,
				'implementation "androidx.appcompat:appcompat:1.6.1"\n'
			);

			fs.writeFileSync(filePath, content, "utf8");
			console.log(
				"[patch-voice-gradle] Successfully patched com.android.support to androidx.appcompat!"
			);
			filePatched = true;
		} else {
			console.log(
				"[patch-voice-gradle] File already patched or does not contain com.android.support."
			);
			filePatched = true;
		}
		break; // Patched the first one we found
	}
}

if (!filePatched) {
	console.warn(
		"[patch-voice-gradle] Warning: Could not find @react-native-voice/voice android/build.gradle to patch."
	);
}
