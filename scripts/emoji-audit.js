const fs = require("fs");
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + "/" + f.name;
    if (f.isDirectory() && f.name !== "node_modules" && f.name !== ".next" && f.name !== "generated") walk(p);
    else if (f.name.endsWith(".tsx") || f.name.endsWith(".ts")) files.push(p);
  }
}
walk("src");
const emojiRe = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u2714\u2716\u2718\u2753\u2B50\u25B2\u25B6\u25BC\u25CF\u2726\u2605\u26A0\u2728\u2713]/gu;
let total = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, "utf-8").split("\n");
  let found = false;
  lines.forEach((line, i) => {
    const matches = [...line.matchAll(emojiRe)];
    if (matches.length > 0) {
      if (!found) { console.log("\n=== " + f.replace("src/", "") + " ==="); found = true; }
      console.log("  L" + (i+1) + ": " + matches.map(m => "U+" + m[0].codePointAt(0).toString(16).toUpperCase()).join(", ") + " -- " + line.trim().substring(0, 90));
      total += matches.length;
    }
  });
}
console.log("\nTotal: " + total + " emoji instances found");
