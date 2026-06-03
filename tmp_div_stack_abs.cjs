const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const tagRegex = /<\/?div\b[^>]*>/g;
const stack = [];
for (let i = 1405; i < 1747; i++) {
  const line = lines[i];
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const tag = match[0];
    const lineNum = i + 1;
    const isClosing = tag.startsWith("</");
    const isSelfClosing = /\/\s*>$/.test(tag);
    if (!isClosing && !isSelfClosing) {
      stack.push({ line: lineNum, tag });
    } else if (isClosing) {
      if (stack.length === 0) {
        console.log(`Extra closing at ${lineNum}: ${tag}`);
      } else {
        const open = stack.pop();
        console.log(
          `Matched close ${tag} at ${lineNum} with open ${open.tag} at ${open.line}; stack ${stack.length}`,
        );
      }
    }
  }
}
console.log(
  "Remaining open:",
  stack.map((x) => `${x.line}:${x.tag}`),
);
