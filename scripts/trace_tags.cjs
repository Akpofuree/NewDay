const fs = require("fs");
const path = require("path");
const file = path.resolve(process.cwd(), "src/components/LandingPage.tsx");
const s = fs.readFileSync(file, "utf8");
let line = 1;
const events = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === "\n") line++;
  if (ch === "<" && s[i + 1] && /[A-Za-z\/]/.test(s[i + 1])) {
    let j = i + 1;
    const closing = s[j] === "/";
    if (closing) j++;
    const nameStart = j;
    while (j < s.length && /[A-Za-z0-9_\-]/.test(s[j])) j++;
    const tag = s.slice(nameStart, j);
    let brace = 0,
      inSingle = false,
      inDouble = false;
    let k = j;
    for (; k < s.length; k++) {
      const c = s[k];
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
        break;
      }
    }
    const between = s.slice(i, k + 1);
    const nl = between.split("\n").length - 1;
    const tagLine = line;
    if (!tag) {
      for (let t = 0; t < nl; t++) line++;
      i = k;
      continue;
    }
    if (closing) {
      events.push({ type: "close", tag, line: tagLine });
    } else {
      // detect selfclosing
      const selfClose = /<[^>]*\/>$/.test(between.replace(/\n/g, " "));
      if (selfClose) events.push({ type: "self", tag, line: tagLine });
      else events.push({ type: "open", tag, line: tagLine });
    }
    for (let t = 0; t < nl; t++) line++;
    i = k;
  }
}
// print events filtered around lines 1180-1428
for (const e of events) {
  if (e.line >= 1180 && e.line <= 1428)
    console.log(`${e.line}: ${e.type} <${e.tag}>`);
}
