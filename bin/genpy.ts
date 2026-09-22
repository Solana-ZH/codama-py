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
function GenIdl(file: string, dirPath: string, programId?: string) {
  //console.log(`file ${file} ${dirPath}`);
  const idl = readJson(file) as any;
  //return;
  let root;
  try {
    // Codama IDLs are root nodes. Anything else is an Anchor IDL: either the
    // current format (with `metadata.spec`) or the legacy pre-0.30 format,
    // both of which rootNodeFromAnchor understands.
    if (idl?.kind === 'rootNode') {
      root = rootNode(idl.program, idl.additionalPrograms);
    } else {
      root = rootNodeFromAnchor(idl as AnchorIdl);
    }
    //const rootNode = rootNodeFromAnchor( as AnchorIdl);
    const codama = createFromRoot(root);
    // Legacy Anchor IDLs usually don't include the program address.
    if (programId) {
      codama.update(updateProgramsVisitor({ [root.program.name]: { publicKey: programId } }));
    } else if (!codama.getRoot().program.publicKey) {
      console.error(`${file}  Error: the IDL has no program address; pass it with --program-id <address>`);
      return;
    }
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
    .option("-d, --dir <dir>", "specify a name to greet", "World")
    .option("-p, --program-id <address>", "program address, required when the IDL does not include one");

  program.parse();
  //console.log(`${JSON.stringify(program.opts())}`);
  GenIdl(program.opts().idl, program.opts().dir, program.opts().programId);
}
main();
