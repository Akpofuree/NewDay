const fs = require("fs");
const parser = require("@babel/parser");
const content = fs.readFileSync("src/components/LandingPage.tsx", "utf8");
try {
  parser.parse(content, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "classProperties", "decorators-legacy"],
  });
  console.log("parsed ok");
} catch (e) {
  console.error("ERROR", e.message);
  if (e.loc) console.error("LINE", e.loc.line, "COL", e.loc.column);
  process.exit(1);
}
