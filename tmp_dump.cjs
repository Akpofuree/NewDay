const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
for (let i = 1479; i < 1750; i++) {
  const line = lines[i];
  if (
    line.match(
      /<section|<\/section>|<div|<\/div>|<AnimatePresence|<\/AnimatePresence>|<motion\.div|<\/motion\.div>/,
    )
  ) {
    console.log(`${i + 1}: ${line}`);
  }
}
