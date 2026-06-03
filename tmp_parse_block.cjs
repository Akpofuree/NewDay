const fs = require("fs");
const parser = require("@babel/parser");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
const start = 1422;
const end = 1518;
const slice = lines.slice(start, end).join("\n");
try {
  parser.parse(`const __FRAG = (${slice});`, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "classProperties", "decorators-legacy"],
  });
  console.log("block parsed ok");
} catch (e) {
  console.error("ERROR", e.message);
  if (e.loc) console.error("LINE", e.loc.line, "COL", e.loc.column);
  process.exit(1);
}
