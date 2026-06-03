const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747);
const text = lines.join("\n");
const openDiv =
  (text.match(/<div(?![\/\w])/g) || []).length +
  (text.match(/<div\b(?![^>]*\/>) /g) || []).length;
const closeDiv = (text.match(/<\/div>/g) || []).length;
console.log("openDiv", openDiv, "closeDiv", closeDiv);
console.log(
  "openSection",
  (text.match(/<section\b/g) || []).length,
  "closeSection",
  (text.match(/<\/section>/g) || []).length,
);
