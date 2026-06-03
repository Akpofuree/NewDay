const fs = require("fs");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const re = /<(\/?)([A-Za-z][A-Za-z0-9_.-]*)([^>]*?)(\/?)>/g;
const stack = [];
for (let i = 1405; i < 1747; i++) {
  const line = lines[i];
  let match;
  while ((match = re.exec(line))) {
    const closing = !!match[1];
    const tag = match[2];
    const selfClosing = closing || match[4] === "/" || /\/>$/.test(match[0]);
    if (
      tag === "img" ||
      tag === "span" ||
      tag === "button" ||
      tag === "input" ||
      tag === "path" ||
      tag === "svg" ||
      tag === "Twitter" ||
      tag === "Linkedin" ||
      tag === "ArrowRight" ||
      tag === "Plus" ||
      tag === "Sparkles" ||
      tag === "AnimatePresence" ||
      tag === "motion.div" ||
      tag === "motion.section" ||
      tag === "motion"
    ) {
      // keep all tags for now
    }
    if (selfClosing) {
      continue;
    }
    if (closing) {
      if (!stack.length) {
        console.log(`Unmatched closing </${tag}> at ${i + 1}: ${line.trim()}`);
      } else {
        const top = stack[stack.length - 1];
        if (top.tag === tag) {
          stack.pop();
        } else {
          console.log(
            `Mismatch at ${i + 1}: closing </${tag}> but top opens <${top.tag}> from line ${top.line}`,
          );
          stack.pop();
        }
      }
    } else {
      stack.push({ tag, line: i + 1, text: line.trim() });
    }
  }
}
console.log("remaining", stack.length);
stack
  .slice(-20)
  .forEach((item) => console.log("OPEN", item.tag, item.line, item.text));
