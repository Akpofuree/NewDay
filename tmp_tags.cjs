const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const re = /<(\/)?([A-Za-z][A-Za-z0-9_.-]*)([^>]*?)(\/?)>/g;
for (let i = 1400; i < 1750; i++) {
  const line = lines[i];
  let match;
  while ((match = re.exec(line))) {
    const closing = match[1] === "/";
    const tag = match[2];
    const selfClosing = match[4] === "/" || /\/>$/.test(line.trim());
    if (
      [
        "div",
        "section",
        "AnimatePresence",
        "motion.div",
        "motion.section",
        "motion",
      ].includes(tag) ||
      tag === "BorderGlow"
    ) {
      console.log(
        `${i + 1}: ${closing ? "</" : "<"}${tag}${selfClosing ? " /" : ""}>${selfClosing ? " selfclose" : ""}  ${line.trim()}`,
      );
    }
  }
}
