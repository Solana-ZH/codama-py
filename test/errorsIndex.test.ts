import { errorNode, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders valid from_tx_error for a single program', async () => {
    const node = rootNode(
        programNode({
            errors: [
                errorNode({
                    code: 5,
                    message: 'Duplicate user order id',
                    name: 'DuplicateUserOrderId',
                }),
            ],
            name: 'testProgram',
            publicKey: 'Test111111111111111111111111111111111111111',
        }),
    );

    const renderMap = visit(node, getRenderMapVisitor());

    await renderMapContains(renderMap, 'errors/__init__.py', [
        'def from_tx_error(',
        ') -> typing.Optional[testProgram.CustomError]:',
        'return testProgram.from_code(extracted[0])',
    ]);
});

test('it renders valid from_tx_error for multiple programs', async () => {
    const node = rootNode(
        programNode({
            errors: [
                errorNode({
                    code: 5,
                    message: 'Alpha error',
                    name: 'AlphaError',
                }),
            ],
            name: 'alphaProgram',
            publicKey: 'Alpha11111111111111111111111111111111111111',
        }),
        [
            programNode({
                errors: [
                    errorNode({
                        code: 7,
                        message: 'Beta error',
                        name: 'BetaError',
                    }),
                ],
                name: 'betaProgram',
                publicKey: 'Beta111111111111111111111111111111111111111',
            }),
        ],
    );

    const renderMap = visit(node, getRenderMapVisitor());

    await renderMapContains(renderMap, 'errors/__init__.py', [
        'def from_tx_error(',
        'program_id: SolPubkey',
        ') -> typing.Optional[typing.Union[',
        'alphaProgram.CustomError,',
        'betaProgram.CustomError,',
        'if program_id == ALPHA_PROGRAM_PROGRAM_ADDRESS:',
        'return alphaProgram.from_code(extracted[0])',
        'if program_id == BETA_PROGRAM_PROGRAM_ADDRESS:',
        'return betaProgram.from_code(extracted[0])',
    ]);
});
