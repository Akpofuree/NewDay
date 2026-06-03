const fs = require("fs");
const text = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/)
  .slice(1405, 1747)
  .join("\n");
const tagRegex = /<\/?div\b[^>]*>/gs;
let stack = [];
let match;
const ops = [];
while ((match = tagRegex.exec(text))) {
  const tag = match[0];
  const index = match.index;
  const line = text.slice(0, index).split(/\n/).length;
  const isClosing = tag.startsWith("</");
  const isSelfClosing = /\/\s*>$/.test(tag);
  if (!isClosing && !isSelfClosing) {
    stack.push({ line, tag });
    ops.push({ type: "open", line, tag, depth: stack.length });
  } else if (isClosing) {
    const depth = stack.length;
    if (stack.length === 0) {
      ops.push({ type: "extraClose", line, tag, depth });
    } else {
      const top = stack.pop();
      ops.push({ type: "close", line, tag, depth, matchedLine: top.line });
    }
  }
}
ops.filter((o) => o.matchedLine === 18).forEach((o) => console.log(o));
console.log("done");
