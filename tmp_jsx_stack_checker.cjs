const fs = require("fs");
const text = fs.readFileSync("src/components/LandingPage.tsx", "utf8");
const start = 1400;
const end = 1750;
const lines = text.split(/\r?\n/).slice(start - 1, end);
const stack = [];
const regex = /<(\/)?([A-Za-z0-9_\-]+)([^>]*)>/g;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  while ((match = regex.exec(line)) !== null) {
    const isClosing = !!match[1];
    const tag = match[2];
    const rest = match[3];
    const selfClosing =
      /\/$/.test(rest.trim()) ||
      ([
        "img",
        "span",
        "div",
        "input",
        "br",
        "hr",
        "path",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "ellipse",
      ].includes(tag.toLowerCase()) &&
        /\/$/.test(rest.trim()));
    if (tag.startsWith("!") || tag === "svg") {
      continue;
    }
    if (isClosing) {
      const top = stack.pop();
      if (!top) {
        console.log(`Line ${start + i}: extra closing </${tag}> no open`);
      } else if (top !== tag) {
        console.log(
          `Line ${start + i}: mismatch closing </${tag}> expected </${top}>`,
        );
      }
    } else if (!selfClosing) {
      stack.push(tag);
    }
  }
}
console.log("Stack remaining", stack);
