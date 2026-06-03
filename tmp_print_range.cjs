const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
for (let i = 1690; i <= 1750; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
