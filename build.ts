import { build, type BuildOptions } from "esbuild";
import { argv } from "node:process";
import { readdir } from "node:fs/promises";

const options: BuildOptions = {
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
	if (example == "index.html") continue;
	options.entryPoints = [path + example + "/src/main.ts"];
	options.outfile = path + example + "/build/out.js";
	await build(options);
}
