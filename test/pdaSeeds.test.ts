import { numberTypeNode, pdaNode, programNode, publicKeyTypeNode, rootNode, variablePdaSeedNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapDoesNotContain } from './_setup';

function renderPda(seeds: ReturnType<typeof variablePdaSeedNode>[]) {
    const node = rootNode(
        programNode({
            name: 'myProgram',
            pdas: [pdaNode({ name: 'tickArray', seeds })],
            publicKey: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        }),
    );
    return visit(node, getRenderMapVisitor());
}

test('it encodes signed integer seeds with signed=True', async () => {
    // Orca `start_tick_index: i32`, Meteora `index: i64`.
    const renderMap = renderPda([
        variablePdaSeedNode('whirlpool', publicKeyTypeNode()),
        variablePdaSeedNode('startTickIndex', numberTypeNode('i32')),
        variablePdaSeedNode('index', numberTypeNode('i64')),
    ]);
    await renderMapContains(renderMap, 'pdas/index.py', [
        "startTickIndex.to_bytes(4, byteorder='little', signed=True),",
        "index.to_bytes(8, byteorder='little', signed=True),",
    ]);
});

test('it does not repeat parameters when a seed is used twice', async () => {
    const renderMap = renderPda([
        variablePdaSeedNode('bondingCurve', publicKeyTypeNode()),
        variablePdaSeedNode('mint', publicKeyTypeNode()),
        variablePdaSeedNode('mint', publicKeyTypeNode()),
    ]);
    await renderMapContains(renderMap, 'pdas/index.py', [
        'def find_tick_array_pda(bondingCurve: SolPubkey, mint: SolPubkey) ->',
    ]);
    await renderMapDoesNotContain(renderMap, 'pdas/index.py', ['mint: SolPubkey, mint: SolPubkey']);
});
