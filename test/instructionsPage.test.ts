import {
    instructionAccountNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    rootNode,
} from "@codama/nodes";
import { visit } from "@codama/visitors-core";
import { test } from "vitest";

import { getRenderMapVisitor } from "../src";
import { renderMapContains } from "./_setup";

test("it renders required and optional instruction accounts", async () => {
    const node = rootNode(
        programNode({
            name: "myProgram",
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: true,
                            name: "authority",
                        }),
                        instructionAccountNode({
                            isOptional: true,
                            isSigner: false,
                            isWritable: false,
                            name: "optionalInfo",
                        }),
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: true,
                            name: "destination",
                        }),
                        instructionAccountNode({
                            isOptional: true,
                            isSigner: true,
                            isWritable: false,
                            name: "optionalSigner",
                        }),
                    ],
                    discriminators: [numberValueNode(42, numberTypeNode("u32"))],
                    name: "myInstruction",
                }),
            ],
            publicKey: "Test111111111111111111111111111111111111111",
        }),
    );

    const renderMap = visit(node, getRenderMapVisitor());

    await renderMapContains(renderMap, "instructions/myInstruction.py", [
        // TypedDict: optional accounts get Optional[] wrapper
        "class MyInstructionAccounts(typing.TypedDict):",
        "    authority:SolPubkey",
        "    optionalInfo: typing.Optional[SolPubkey]",
        "    destination:SolPubkey",
        "    optionalSigner: typing.Optional[SolPubkey]",
        // Required accounts always appended
        "    keys.append(AccountMeta(pubkey=accounts[\"authority\"], is_signer=False, is_writable=True))",
        "    keys.append(AccountMeta(pubkey=accounts[\"destination\"], is_signer=False, is_writable=True))",
        // Optional accounts conditionally appended (preserving order)
        "    if accounts.get(\"optionalInfo\") is not None:",
        "        keys.append(AccountMeta(pubkey=accounts[\"optionalInfo\"], is_signer=False, is_writable=False))",
        "    if accounts.get(\"optionalSigner\") is not None:",
        "        keys.append(AccountMeta(pubkey=accounts[\"optionalSigner\"], is_signer=True, is_writable=False))",
    ]);


});

test("it renders instruction without optional accounts unchanged", async () => {
    const node = rootNode(
        programNode({
            name: "myProgram",
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: true,
                            name: "authority",
                        }),
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: true,
                            name: "destination",
                        }),
                    ],
                    discriminators: [numberValueNode(42, numberTypeNode("u32"))],
                    name: "simpleInstruction",
                }),
            ],
            publicKey: "Test111111111111111111111111111111111111111",
        }),
    );

    const renderMap = visit(node, getRenderMapVisitor());

    await renderMapContains(renderMap, "instructions/simpleInstruction.py", [
        "class SimpleInstructionAccounts(typing.TypedDict):",
        "    authority:SolPubkey",
        "    destination:SolPubkey",
    ]);
});
