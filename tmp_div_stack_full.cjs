const fs = require("fs");
const text = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747)
  .join("\n");
const openRegex = /<div\b[^>]*>/gs;
const closeRegex = /<\/div>/g;
let openMatches = Array.from(text.matchAll(openRegex));
let closeMatches = Array.from(text.matchAll(closeRegex));
console.log(
  "open div total",
  openMatches.length,
  "close div total",
  closeMatches.length,
);
const selfClosing = openMatches.filter((m) => /\/\s*>$/.test(m[0])).length;
console.log(
  "selfClosing div",
  selfClosing,
  "normal open",
  openMatches.length - selfClosing,
);
