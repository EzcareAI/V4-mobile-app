import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "components/onboarding/screens");
const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));

for (const file of files) {
	const filePath = join(dir, file);
	let content = readFileSync(filePath, "utf8");

	// Remove <SafeAreaView edges={['bottom']} ...> wrapping the whole block
	content = content.replace(
		/<SafeAreaView[^>]*edges=\{\["bottom"\]\}[^>]*>([\s\S]*?)<\/SafeAreaView>/g,
		"$1"
	);

	// Remove pb-8 from the main container
	content = content.replace(
		/className="([^"]*)pb-8([^"]*)"/g,
		(_match, p1, p2) => {
			return `className="${(p1 + p2).replace(/\s+/g, " ").trim()}"`;
		}
	);

	// Remove the <View className="pt-4"> wrapper around ContinueButton
	content = content.replace(
		/<View className="pt-4">\s*(<ContinueButton[\s\S]*?\/>)\s*<\/View>/g,
		"$1"
	);

	// Remove unused SafeAreaView imports
	if (!content.includes("<SafeAreaView")) {
		content = content.replace(
			/import\s*\{\s*SafeAreaView\s*\}\s*from\s*"react-native-safe-area-context";?\n/g,
			""
		);
	}

	writeFileSync(filePath, content, "utf8");
}
console.log(`Processed ${files.length} files`);
