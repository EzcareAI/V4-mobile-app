const fs = require("fs");
const path = require("path");
const dirs = ["apps/native/components", "apps/native/app"];
// This maps the old native app hexes to the new EZCare-Saas Hex Colors
const map = {
	"#00A8A8/10": "#EAF3F1", // Teal/10 variant maps to pure mint background
	"#00A8A8": "#28B898", // True Teal override
	"#1A2138": "#29303D", // Navy Text
	"#60708F": "#73808C", // Slate/Muted Text
};
function walk(dir) {
	if (!fs.existsSync(dir)) return;
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const p = path.join(dir, file);
		if (fs.statSync(p).isDirectory()) walk(p);
		else if (p.endsWith(".tsx") || p.endsWith(".ts")) {
			const c = fs.readFileSync(p, "utf8");
			let mc = c;
			for (const k in map) {
				mc = mc.split(k).join(map[k]);
			}
			if (c !== mc) {
				fs.writeFileSync(p, mc);
				console.log("Updated " + p);
			}
		}
	}
}
dirs.forEach((d) => walk(path.join(__dirname, d)));
console.log("Done");
