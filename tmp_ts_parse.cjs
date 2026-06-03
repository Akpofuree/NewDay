const fs = require("fs");
let ts;
try {
  ts = require("typescript");
} catch (e) {
  console.error("typescript not found");
  process.exit(1);
}
const program = ts.createProgram(["src/components/LandingPage.tsx"], {
  jsx: ts.JsxEmit.Preserve,
  allowJs: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log(
  diagnostics
    .map((d) => ({
      message: ts.flattenDiagnosticMessageText(d.messageText, " "),
      start: d.start,
      line: d.file
        ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
        : undefined,
      code: d.code,
    }))
    .slice(0, 50),
);
