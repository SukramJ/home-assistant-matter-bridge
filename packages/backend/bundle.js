import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import externalizeAllPackagesExcept from "esbuild-plugin-noexternal";
import { rimraf } from "rimraf";

const src = path.resolve(import.meta.dirname, "src");
const dist = path.resolve(import.meta.dirname, "dist");

await rimraf(dist);
await buildBackend();

async function buildBackend() {
  process.stdout.write("Building Backend... ");
  await esbuild.build({
    bundle: true,
    entryPoints: [path.resolve(src, "cli.ts")],
    platform: "node",
    outdir: path.resolve(dist),
    treeShaking: true,
    target: "node20",
    format: "esm",
    minify: false,
    sourcemap: "linked",
    plugins: [
      externalizeAllPackagesExcept(["@home-assistant-matter-bridge/common"]),
      doNotBundleFile(src, ["bootstrap.js"]),
    ],
  });

  const bootstrapFile = esbuild.transformSync(
    fs.readFileSync(path.resolve(src, "bootstrap.ts"), { encoding: "utf-8" }),
    { loader: "ts", format: "esm", target: "node20" },
  );
  fs.writeFileSync(path.resolve(dist, "bootstrap.js"), bootstrapFile.code);

  const stat = fs.statSync(path.resolve(dist, "cli.js"));
  process.stdout.write(`Done (${stat.size / 1024} KB)\n`);
}

function doNotBundleFile(sourcesRoot, files) {
  return {
    name: "doNotBundleFile",
    setup(build) {
      build.onResolve({ filter: /^\..*$/ }, (args) => {
        if (args.kind !== "import-statement" || !args.path.startsWith(".")) {
          return;
        }
        const filePath = path.resolve(args.resolveDir, args.path);
        const relativePath = path.relative(sourcesRoot, filePath);
        if (!files.includes(relativePath)) {
          return;
        }
        return { path: args.path, external: true };
      });
    },
  };
}
