const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747);
const text = lines.join("\n");
console.log(
  "opens=",
  (text.match(/<div\b/g) || []).length,
  "closes=",
  (text.match(/<\/div>/g) || []).length,
);
