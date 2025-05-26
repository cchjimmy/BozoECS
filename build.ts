import { build, type BuildOptions } from "npm:esbuild";
import { argv } from "node:process";
import { readdir, rm, stat } from "node:fs/promises";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

const options: BuildOptions = {
  plugins: [...denoPlugins()],
  bundle: true,
  minify: true,
};

if (argv.length > 2) {
  if (argv[2] == "debug") {
    options.sourcemap = "linked";
  }
}

const path = "examples/";
const examples = await readdir(path);

for (const example of examples) {
  const s = await stat(path + example);
  if (!s.isDirectory()) continue;
  await rm(path + example + "/build", { recursive: true, force: true });
  options.entryPoints = [path + example + "/src/main.ts"];
  options.outfile = path + example + "/build/out.js";
  await build(options);
}
