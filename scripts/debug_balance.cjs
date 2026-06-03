const fs = require("fs");
const path = require("path");
const file = path.resolve(process.cwd(), "src/components/LandingPage.tsx");
const s = fs.readFileSync(file, "utf8");
let line = 1;
const stack = [];
function advanceLines(str) {
  const nl = str.split("\n").length - 1;
  for (let i = 0; i < nl; i++) line++;
}
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === "\n") line++;
  if (ch === "<" && s[i + 1] && /[A-Za-z\/]/.test(s[i + 1])) {
    let j = i + 1;
    const closing = s[j] === "/" ? true : false;
    if (closing) j++;
    const nameStart = j;
    while (j < s.length && /[A-Za-z0-9_\-]/.test(s[j])) j++;
    const tag = s.slice(nameStart, j);
    // read until > ignoring braces and quotes
    let brace = 0,
      inS = false,
      inD = false;
    let k = j;
    for (; k < s.length; k++) {
      const c = s[k];
      if (inS) {
        if (c === "'") inS = false;
        else if (c === "\\") k++;
        continue;
      }
      if (inD) {
        if (c == '"') inD = false;
        else if (c === "\\") k++;
        continue;
      }
      if (c === "'") {
        inS = true;
        continue;
      }
      if (c == '"') {
        inD = true;
        continue;
      }
      if (c == "{") {
        brace++;
        continue;
      }
      if (c == "}") {
        if (brace > 0) brace--;
        continue;
      }
      if (c === ">" && brace === 0 && !inS && !inD) break;
    }
    const between = s.slice(i, k + 1);
    const nl = between.split("\n").length - 1;
    const tagLine = line;
    if (!tag) {
      advanceLines(between);
      i = k;
      continue;
    }
    if (closing) {
      const top = stack.length ? stack[stack.length - 1] : null;
      if (!top) {
        console.log("Unmatched closing", tag, "at", tagLine);
        process.exit(1);
      }
      if (top.tag !== tag) {
        console.log(
          "MISMATCH at",
          tagLine,
          `found </${tag}> but top is <${top.tag}> opened at ${top.line}`,
        );
        console.log("Stack dump:");
        console.log(stack.map((x) => `${x.tag}@${x.line}`).join(" | "));
        console.log("Context:");
        const ctx = s.slice(Math.max(0, i - 200), Math.min(s.length, k + 200));
        console.log(ctx);
        process.exit(1);
      }
      stack.pop();
    } else {
      const selfClose = /<[^>]*\/>$/.test(between.replace(/\n/g, " "));
      if (!selfClose) stack.push({ tag, line: tagLine });
    }
    advanceLines(between);
    i = k;
  }
}
if (stack.length) {
  console.log(
    "Unclosed at EOF:",
    stack.map((x) => `${x.tag}@${x.line}`).join(", "),
  );
  process.exit(1);
}
console.log("Balanced");
