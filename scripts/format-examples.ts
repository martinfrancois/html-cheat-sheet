// Applies the layout rule in src/lib/format-example.ts to the example code of every entry, in
// place: pnpm run format-examples. Only the code changes; the rest of each file stays as written.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";
import { formatExample } from "../src/lib/format-example.ts";

const directory = "src/content/entries";
for (const file of readdirSync(directory).filter((name) => name.endsWith(".yaml"))) {
  const path = `${directory}/${file}`;
  let source = readFileSync(path, "utf8");
  for (const { code } of parse(source).examples as { code: string }[]) {
    const formatted = formatExample(code.trimEnd());
    if (formatted === code.trimEnd()) continue;
    // Block scalars indent the code by six spaces under "examples: - code: |".
    const block = (text: string) => text.split("\n").map((line) => (line ? `      ${line}` : line)).join("\n");
    if (!source.includes(block(code.trimEnd()))) throw new Error(`${path}: can't find the code block to replace`);
    source = source.replace(block(code.trimEnd()), block(formatted));
    console.log(`${path}: reformatted an example`);
  }
  writeFileSync(path, source);
}
