const fs = require("fs");
const text = fs.readFileSync("src/components/LandingPage.tsx", "utf8");
const lines = text.split(/\r?\n/);
const re = /<\/?div\b[^>]*>/g;
for (let i = 1405; i < 1747; i++) {
  const line = lines[i];
  let match;
  while ((match = re.exec(line)) !== null) {
    console.log(`${i + 1}: ${match[0]}`);
  }
}
