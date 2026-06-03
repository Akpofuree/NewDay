const fs = require("fs");
const path = require("path");
const file = path.resolve(process.cwd(), "src/components/LandingPage.tsx");
const s = fs.readFileSync(file, "utf8");
const re = /<(\/)?([A-Za-z_][A-Za-z0-9_\-]*)\b[^>]*?(\/?)>/g;
let m;
const stack = [];
let line = 1;
const lines = s.split("\n");
let pos = 0;
while ((m = re.exec(s)) !== null) {
  const full = m[0];
  const closing = !!m[1];
  const tag = m[2];
  const selfclosing = !!m[3] || /\/>$/.test(full);
  const idx = m.index;
  while (pos + lines[0].length + 1 <= idx) {
    pos += lines.shift().length + 1;
    line++;
  }
  if (closing) {
    if (stack.length === 0) {
      console.log(`Unmatched closing </${tag}> at line ${line}`);
      process.exit(1);
    }
    const last = stack.pop();
    if (last.tag !== tag) {
      console.log(
        `Tag mismatch at line ${line}: expected </${last.tag}> but found </${tag}>`,
      );
      console.log("Stack snapshot (bottom->top):");
      console.log(stack.map((x) => `${x.tag}@${x.line}`).join(" | "));
      console.log("Popped element:", last);
      console.log("Context around error:");
      const ctx = s.slice(Math.max(0, idx - 120), idx + 120);
      console.log(ctx);
      process.exit(1);
    }
  } else if (!selfclosing) {
    stack.push({ tag, line });
  }
}
if (stack.length) {
  console.log("Unclosed tags:");
  stack
    .slice()
    .reverse()
    .forEach((x) => console.log(`${x.tag} opened at line ${x.line}`));
  process.exit(1);
}
console.log("No mismatches detected");
