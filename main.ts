import { serveDir } from "@std/http/file-server";

const options: Deno.bundle.Options = {
  minify: true,
  entrypoints: [""],
  format: "iife",
};

if (Deno.args[0] == "debug") {
  options.sourcemap = "linked";
}

const path = "examples/";
const examples = Deno.readDirSync(path);

for (const example of examples) {
  if (!example.isDirectory) continue;
  try {
    await Deno.remove(path + example.name + "/build", { recursive: true });
  } catch {
    // do nothing
  }
  options.entrypoints = [path + example.name + "/src/main.ts"];
  options.outputPath = path + example.name + "/build/out.js";
  Deno.bundle(options);
}

Deno.serve((req) => serveDir(req, { fsRoot: "examples" }));
