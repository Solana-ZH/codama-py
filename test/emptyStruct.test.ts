import { definedTypeNode, programNode, structTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders a valid TypedDict for structs without fields', async () => {
    // e.g. Marinade's legacy IDL declares `StakeList {}`.
    const node = programNode({
        definedTypes: [definedTypeNode({ name: 'stakeList', type: structTypeNode([]) })],
        name: 'marinadeFinance',
        publicKey: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
    });

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'types/stakeList.py', ['class StakeListJSON(typing.TypedDict):\n    pass']);
});
