const fs = require("fs");
const path = require("path");
const dirs = ["apps/native/components", "apps/native/app"];
const map = {
	"bg-ezcare-teal": "bg-[#00A8A8]",
	"text-ezcare-teal": "text-[#00A8A8]",
	"border-ezcare-teal": "border-[#00A8A8]",
	"shadow-ezcare-teal": "shadow-[#00A8A8]/30",
	"bg-ezcare-navy": "bg-[#1A2138]",
	"text-ezcare-navy": "text-[#1A2138]",
	"border-ezcare-navy": "border-[#1A2138]",
	"bg-ezcare-slate": "bg-[#60708F]",
	"text-ezcare-slate": "text-[#60708F]",
	"border-ezcare-slate": "border-[#60708F]",
	"bg-ezcare-aqua": "bg-[#2DE2E2]",
	"text-ezcare-aqua": "text-[#2DE2E2]",
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
