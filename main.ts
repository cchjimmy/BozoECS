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
  const examplePath = path + example.name;
  buildExample(examplePath, options);
  watchExample(examplePath);
}

const nets = Deno.networkInterfaces();
function isPrivate(networkInterfaces: Deno.NetworkInterfaceInfo) {
  return (
    networkInterfaces.name.toLowerCase().includes("vboxnet") ||
    networkInterfaces.name.toLowerCase().includes("docker") ||
    networkInterfaces.name.toLowerCase().includes("lo")
  );
}
const hostname = nets.find((v) => v.family == "IPv4" && !isPrivate(v))?.address;
if (hostname) {
  Deno.serve({ hostname }, (req) => serveDir(req, { fsRoot: path }));
}

async function watchExample(examplePath: string) {
  const watcher = Deno.watchFs(examplePath + "/src/");
  for await (const event of watcher) {
    if (event.kind != "modify") continue;
    console.log(`Files in ${examplePath} have changed`);
    buildExample(examplePath, options);
  }
}

async function buildExample(
  examplePath: string,
  buildOpts: Deno.bundle.Options,
) {
  console.log(`Building ${examplePath}`);
  try {
    await Deno.remove(examplePath + "/build", { recursive: true });
  } catch {
    // do nothing
  }
  buildOpts.entrypoints = [examplePath + "/src/main.ts"];
  buildOpts.outputPath = examplePath + "/build/out.js";
  Deno.bundle(buildOpts);
}
