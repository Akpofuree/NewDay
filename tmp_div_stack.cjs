const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747);
const stack = [];
for (let idx = 0; idx < lines.length; idx++) {
  const line = lines[idx];
  const openMatches = [...line.matchAll(/<div\b[^>]*>/g)];
  const closeMatches = [...line.matchAll(/<\/div>/g)];
  for (const m of openMatches) {
    const tag = m[0];
    const selfClosing = /<div\b[^>]*\/\s*>$/.test(tag);
    if (!selfClosing) stack.push({ line: 1406 + idx, text: line.trim() });
  }
  for (const m of closeMatches) {
    if (!stack.length) {
      console.log("Extra closing </div> at", 1406 + idx, "line:", line.trim());
    } else {
      stack.pop();
    }
  }
}
console.log("remaining opens", stack.length);
stack
  .slice(-10)
  .forEach((item) => console.log("OPEN at", item.line, item.text));
