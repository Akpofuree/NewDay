const fs = require("fs");
const text = fs.readFileSync("src/components/LandingPage.tsx", "utf8");
const segment = text.split(/\r?\n/).slice(1405, 1747).join("\n");
const tagRegex = /<\/?div\b[\s\S]*?>/g;
let stack = [];
let match;
while ((match = tagRegex.exec(segment))) {
  const tag = match[0];
  const index = match.index;
  const line = segment.slice(0, index).split(/\n/).length + 1405;
  const isClosing = tag.startsWith("</");
  const isSelfClosing = /\/\s*>$/.test(tag);
  if (!isClosing && !isSelfClosing) {
    stack.push({ line, tag });
  } else if (isClosing) {
    if (stack.length === 0) {
      console.log(`Extra closing at ${line}: ${tag}`);
    } else {
      const open = stack.pop();
      console.log(
        `Matched close ${tag} at ${line} with open ${open.tag} at ${open.line}; stack ${stack.length}`,
      );
    }
  }
}
console.log(
  "Remaining open:",
  stack.map((x) => `${x.line}:${x.tag}`),
);
