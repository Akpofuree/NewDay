const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
for (let i = 1600; i <= 1765; i++) {
  const line = lines[i];
  const leading = (line.match(/^ */) || [""])[0].length;
  console.log(`${i + 1}: ${leading}: ${line}`);
}
