const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const stack = [];
const re = /<(\/)?(section|div)(?=[\s>])/g;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  while ((match = re.exec(line))) {
    const closing = match[1] === "/";
    const tag = match[2];
    if (!closing) {
      stack.push({ tag, line: i + 1 });
    } else {
      if (!stack.length) {
        console.log(`Unmatched closing </${tag}> at ${i + 1}`);
      } else {
        const top = stack[stack.length - 1];
        if (top.tag === tag) {
          stack.pop();
        } else {
          console.log(
            `Mismatch at ${i + 1}: closing </${tag}> expected </${top.tag}> from line ${top.line}`,
          );
          stack.pop();
        }
      }
    }
  }
  if (i >= 1479 && i <= 1746) {
    // no-op, just scanning region
  }
}
console.log("Remaining stack size", stack.length);
for (const item of stack)
  console.log("Remaining", item.tag, "opened at", item.line);
