import { errorNode, programNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders valid from_tx_error for a single program', async () => {
    const node = programNode({
        errors: [
            errorNode({
                code: 5,
                message: 'Duplicate user order id',
                name: 'DuplicateUserOrderId',
            }),
        ],
        name: 'testProgram',
        publicKey: 'Test111111111111111111111111111111111111111',
    });

    const renderMap = visit(node, getRenderMapVisitor());

    await renderMapContains(renderMap, 'errors/__init__.py', [
        'def from_tx_error(',
        ') -> typing.Optional[testProgram.CustomError]:',
        'return testProgram.from_code(extracted[0])',
    ]);
});
