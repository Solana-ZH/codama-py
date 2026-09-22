import { instructionNode, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapDoesNotContain } from './_setup';

test('it exports every instruction from instructions/__init__.py', async () => {
    const node = rootNode(
        programNode({
            instructions: [instructionNode({ name: 'openTrade' }), instructionNode({ name: 'closeTrade' })],
            name: 'tradeJournal',
            publicKey: '81ZTev5MKDncJawq8iLdpqSUTdy5JvnETa8PvQXfCrtV',
        }),
    );

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'instructions/__init__.py', [
        'from .closeTrade import CloseTrade',
        'from .openTrade import OpenTrade',
    ]);
    await renderMapDoesNotContain(renderMap, 'instructions/__init__.py', [`import'./`]);
});
