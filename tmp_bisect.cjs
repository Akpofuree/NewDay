const fs = require("fs");
const parser = require("@babel/parser");
const lines = fs
  .readFileSync("src/components/LandingPage.tsx", "utf8")
  .split(/\r?\n/);
let failLine = null;
for (let end = 1450; end <= 1747; end += 5) {
  const slice = lines.slice(1405, end).join("\n");
  try {
    parser.parse(`const __FRAG = (${slice});`, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "classProperties", "decorators-legacy"],
    });
  } catch (e) {
    console.log(
      "failed at end",
      end,
      "orig line",
      end + 1,
      "errorline",
      e.loc ? e.loc.line : "no",
    );
    failLine = end;
    break;
  }
}
if (failLine === null) console.log("no failure up to 1747");
