const fs = require("fs");
const text = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1748)
  .join("\n");
const tagRegex = /<\/?div\b[^>]*>/gs;
let stack = [];
let match;
while ((match = tagRegex.exec(text))) {
  const tag = match[0];
  const index = match.index;
  const line = text.slice(0, index).split(/\n/).length;
  const isClosing = tag.startsWith("</");
  if (!isClosing && !/\/\s*>$/.test(tag)) {
    stack.push({ line, tag });
  } else if (isClosing) {
    if (stack.length === 0) {
      console.log("Extra closing at", line, tag);
    } else {
      const open = stack.pop();
      console.log(
        `Matched closing at ${line} ${tag} with open at ${open.line} ${open.tag} (stack size ${stack.length})`,
      );
    }
  }
}
console.log("remaining", stack.length);
for (const item of stack) console.log("unclosed", item.line, item.tag);
