const fs = require("fs");
const path = require("path");
const file = path.resolve(process.cwd(), "src/components/LandingPage.tsx");
const s = fs.readFileSync(file, "utf8");
const stack = [];
let line = 1;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === "\n") line++;
  if (ch === "<" && s[i + 1] && /[A-Za-z\/]/.test(s[i + 1])) {
    // parse tag
    let j = i + 1;
    const closing = s[j] === "/";
    if (closing) j++;
    // read tag name
    const nameStart = j;
    while (j < s.length && /[A-Za-z0-9_\-]/.test(s[j])) j++;
    const tag = s.slice(nameStart, j);
    // now read until matching '>' ignoring braces and quotes
    let brace = 0,
      inSingle = false,
      inDouble = false;
    let selfClose = false;
    let k = j;
    for (; k < s.length; k++) {
      const c = s[k];
      if (c === "\n") {
      }
      if (inSingle) {
        if (c === "'") inSingle = false;
        else if (c === "\\") k++;
        continue;
      }
      if (inDouble) {
        if (c == '"') inDouble = false;
        else if (c === "\\") k++;
        continue;
      }
      if (c === "'") {
        inSingle = true;
        continue;
      }
      if (c == '"') {
        inDouble = true;
        continue;
      }
      if (c === "{") {
        brace++;
        continue;
      }
      if (c === "}") {
        if (brace > 0) brace--;
        continue;
      }
      if (c === ">" && brace === 0 && !inSingle && !inDouble) {
        // check if previous char was '/'
        if (s[k - 1] === "/") selfClose = true;
        break;
      }
    }
    if (k >= s.length) {
      console.log("Unterminated tag at EOF starting at line", line);
      process.exit(1);
    }
    const tagLine = line;
    // if tag is empty (fragment <> or </>), ignore entirely
    if (!tag) {
      // advance i and line
      const between = s.slice(i, k + 1);
      const nl = between.split("\n").length - 1;
      for (let t = 0; t < nl; t++) line++;
      i = k;
      continue;
    }
    // count newlines between i and k
    const between = s.slice(i, k + 1);
    const nl = between.split("\n").length - 1;
    // push/pop
    if (closing) {
      if (stack.length === 0) {
        console.log(`Unmatched closing </${tag}> at line ${tagLine}`);
        process.exit(1);
      }
      const last = stack.pop();
      if (last.tag !== tag) {
        console.log(
          `Tag mismatch at line ${tagLine}: expected </${last.tag}> but found </${tag}>`,
        );
        console.log("stack top was", last);
        process.exit(1);
      }
    } else if (!selfClose) {
      stack.push({ tag, line: tagLine });
    }
    // advance i and line
    for (let t = 0; t < nl; t++) line++;
    i = k;
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
