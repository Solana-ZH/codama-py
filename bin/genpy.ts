import { renderVisitor } from "../dist/index.node.cjs";
import { visit } from "@codama/visitors-core";

import { createFromRoot, updateProgramsVisitor } from "codama";
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { readJson } from "@codama/renderers-core";
import path from "path";
import { rootNode } from "@codama/nodes";
import { program } from "commander";

const options = {};
function GenIdl(file: String, dirPath: String) {
  //console.log(`file ${file} ${dirPath}`);
  const idl = readJson(file as string);
  //return;
  let root;
  try {
    if (idl?.metadata?.spec) {
      root = rootNodeFromAnchor(idl);
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
