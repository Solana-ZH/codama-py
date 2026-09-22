import {
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapDoesNotContain } from './_setup';

test('it renders inline tuple instruction arguments as valid Python', async () => {
    // Given an instruction with a newtype arg (`struct OptionU64(u64)`) and a two-item tuple arg,
    // as Codama produces when it inlines single-use defined types.
    const node = rootNode(
        programNode({
            instructions: [
                instructionNode({
                    arguments: [
                        instructionArgumentNode({ name: 'creatorFeeBps', type: tupleTypeNode([numberTypeNode('u64')]) }),
                        instructionArgumentNode({
                            name: 'pair',
                            type: tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]),
                        }),
                    ],
                    name: 'createPool',
                }),
            ],
            name: 'pumpAmm',
            publicKey: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
        }),
    );

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'instructions/createPool.py', [
        'creatorFeeBps:int',
        '"creatorFeeBps" /borsh.TupleStruct(borsh.U64)',
        '"creatorFeeBps":[args["creatorFeeBps"]]',
        '"pair":[args["pair"][0], args["pair"][1]]',
    ]);
    await renderMapDoesNotContain(renderMap, 'instructions/createPool.py', ['self.value', '"item_0"']);
});
