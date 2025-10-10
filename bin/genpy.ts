import { renderVisitor } from "../src/renderVisitor";
import { visit } from "@codama/visitors-core";

import { createFromRoot, updateProgramsVisitor } from "codama";
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { readJson } from "@codama/renderers-core";
import path from "path";
import { rootNode } from "@codama/nodes";
import { program } from "commander";
globalThis.__ESM__ = true;
globalThis.__TEST__ = process.env.NODE_ENV === 'test';
const options = {};
function GenIdl(file: string, dirPath: string) {
  //console.log(`file ${file} ${dirPath}`);
  const idl = readJson(file) as any;
  //return;
  let root;
  try {
    if (idl?.metadata?.spec) {
      root = rootNodeFromAnchor(idl as AnchorIdl);
    } else {
      root = rootNode(idl.program, idl.additionalPrograms);
    }
    //const rootNode = rootNodeFromAnchor( as AnchorIdl);
    const codama = createFromRoot(root);
    codama.accept(renderVisitor(dirPath, options));
  } catch (e) {
    console.error(`${file}  ` + e.stack);
  }
}
function main() {
  program
    .version("1.0.0")
    .description("A simple CLI tool built with TypeScript")
    .option("-i, --idl <idl>", "specify a name to greet", "World")
    .option("-d, --dir <dir>", "specify a name to greet", "World");

  program.parse();
  //console.log(`${JSON.stringify(program.opts())}`);
  GenIdl(program.opts().idl, program.opts().dir);
}
main();
