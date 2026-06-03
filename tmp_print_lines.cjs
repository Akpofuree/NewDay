const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const start = parseInt(process.argv[2], 10) || 1;
const end = parseInt(process.argv[3], 10) || start;
for (let i = start - 1; i < end && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
