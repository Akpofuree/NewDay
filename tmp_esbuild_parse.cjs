const esbuild = require("esbuild");
const fs = require("fs");
const src = fs.readFileSync("src/components/LandingPage.tsx", "utf8");
try {
  esbuild.buildSync({
    stdin: {
      contents: src,
      sourcefile: "LandingPage.tsx",
      loader: "tsx",
    },
    write: false,
    bundle: false,
    sourcemap: false,
    outfile: "out.js",
  });
  console.log("parsed");
} catch (e) {
  console.error("esbuild parse failed");
  console.error(e.errors || e);
  process.exit(1);
}
