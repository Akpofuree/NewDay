const fs = require("fs");
const text = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747)
  .join("\n");
const openRegex = /<div\b[^>]*>/gs;
const closeRegex = /<\/div>/g;
const tagRegex = /<\/?div\b[^>]*>/gs;
const lines = text.split(/\n/);
let stack = [];
let match;
while ((match = tagRegex.exec(text))) {
  const tag = match[0];
  const index = match.index;
  const line = text.slice(0, index).split(/\n/).length;
  const isClosing = tag.startsWith("</");
  const isSelfClosing = /\/\s*>$/.test(tag);
  if (!isClosing && !isSelfClosing) {
    stack.push({ line, tag });
  } else if (isClosing) {
    if (stack.length === 0) {
      console.log("Extra closing at", line, tag);
    } else {
      stack.pop();
    }
  }
}
console.log("remaining", stack.length);
for (const item of stack.slice(-10))
  console.log("unclosed", item.line, item.tag);
