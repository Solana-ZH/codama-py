import { errorNode, programNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders codes for errors', async () => {
    // Given the following program with 2 errors.
    const node = programNode({
        errors: [
            errorNode({
                code: 6000,
                message: 'Invalid instruction',
                name: 'InvalidInstruction',
            }),
            errorNode({
                code: 7000,
                message: 'Invalid program',
                name: 'InvalidProgram',
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    //console.log(renderMap.get("errors/splToken.py"));
    await renderMapContains(renderMap, 'errors/splToken.py', [
        `6000: InvalidInstruction(),`,
        `7000: InvalidProgram(),`,
    ]);
});

test('it renders error messages as escaped Python strings', async () => {
    const node = programNode({
        errors: [
            errorNode({ code: 6000, message: 'Symbol is "too" long', name: 'InvalidSymbol' }),
            errorNode({ code: 6001, message: '', name: 'NoMessage' }),
        ],
        name: 'tradeJournal',
        publicKey: '81ZTev5MKDncJawq8iLdpqSUTdy5JvnETa8PvQXfCrtV',
    });

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'errors/tradeJournal.py', [
        `msg = "Symbol is \\"too\\" long"`,
        `6000, "Symbol is \\"too\\" long"`,
        `msg = ""`,
    ]);
});
