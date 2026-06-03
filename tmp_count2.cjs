const fs = require("fs");
const text = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747)
  .join("\n");
const allDivOpen = Array.from(text.matchAll(/<div\b[^>]*>/g)).map((m) => m[0]);
const selfClosing = allDivOpen.filter((t) => /\/\>\s*$/.test(t)).length;
const normalOpen = allDivOpen.length - selfClosing;
const closeDiv = (text.match(/<\/div>/g) || []).length;
console.log(
  "div open",
  normalOpen,
  "selfclosing",
  selfClosing,
  "closeDiv",
  closeDiv,
);
