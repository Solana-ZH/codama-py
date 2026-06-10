import {
  constantPdaSeedNode,
  instructionAccountNode,
  instructionNode,
  pdaLinkNode,
  pdaNode,
  pdaValueNode,
  programNode,
  publicKeyTypeNode,
  rootNode,
  stringTypeNode,
  stringValueNode,
  variablePdaSeedNode,
} from "@codama/nodes";
import { visit } from "@codama/visitors-core";
import { test } from "vitest";

import { getRenderMapVisitor } from "../src";
import { renderMapContains, renderMapDoesNotContain } from "./_setup";

const eventAuthorityPda = pdaNode({
  name: "eventAuthority",
  seeds: [
    constantPdaSeedNode(
      stringTypeNode("utf8"),
      stringValueNode("event_authority"),
    ),
  ],
});

test("it renders a valid Python pdas index with constant string seeds", async () => {
  const node = rootNode(
    programNode({
      name: "myProgram",
      pdas: [eventAuthorityPda],
      publicKey: "Test111111111111111111111111111111111111111",
    }),
  );

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "pdas/index.py", [
    "def find_event_authority_pda() -> typing.Tuple[SolPubkey, int]:",
    'b"event_authority",',
    "MY_PROGRAM_PROGRAM_ADDRESS",
  ]);
  await renderMapDoesNotContain(renderMap, "pdas/index.py", ["export * from"]);
});

test("it renders variable seeds as typed parameters in the pdas index", async () => {
  const node = rootNode(
    programNode({
      name: "myProgram",
      pdas: [
        pdaNode({
          name: "channel",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode("channel"),
            ),
            variablePdaSeedNode("authority", publicKeyTypeNode()),
            variablePdaSeedNode("namespace", stringTypeNode("utf8")),
          ],
        }),
      ],
      publicKey: "Test111111111111111111111111111111111111111",
    }),
  );

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "pdas/index.py", [
    "def find_channel_pda(authority: SolPubkey, namespace: str) -> typing.Tuple[SolPubkey, int]:",
    'b"channel",',
    "bytes(authority),",
    'namespace.encode("utf-8"),',
  ]);
});

test("it resolves pdaLinkNode defaults when rendering instruction PDA helpers", async () => {
  const node = rootNode(
    programNode({
      instructions: [
        instructionNode({
          accounts: [
            instructionAccountNode({
              defaultValue: pdaValueNode(pdaLinkNode("eventAuthority")),
              isSigner: false,
              isWritable: false,
              name: "eventAuthority",
            }),
          ],
          name: "open",
        }),
      ],
      name: "myProgram",
      pdas: [eventAuthorityPda],
      publicKey: "Test111111111111111111111111111111111111111",
    }),
  );

  const renderMap = visit(node, getRenderMapVisitor());

  // Without link resolution the seed list rendered empty, deriving the
  // wrong address at runtime.
  await renderMapContains(renderMap, "instructions/open.py", [
    "def find_EventAuthority() -> typing.Tuple[SolPubkey, int]:",
    'b"event_authority",',
  ]);
});
