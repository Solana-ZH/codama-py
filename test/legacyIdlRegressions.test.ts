import {
    accountNode,
    arrayTypeNode,
    bytesTypeNode,
    definedTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    prefixedCountNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it encodes u32-prefixed vectors of public keys', async () => {
    // Jupiter Perps: `Perpetuals.pools: Vec<Pubkey>`.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        name: 'pools',
                        type: arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
                    }),
                ]),
                name: 'perpetuals',
            }),
        ],
        name: 'perpetuals',
        publicKey: 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu',
    });

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'accounts/perpetuals.py', ['"pools": self.pools,']);
});

test('it imports the layout helpers used inside enum tuple variants', async () => {
    // Kamino: `UpdateLendingMarketConfigValue::U8Array([u8; 8])`.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'configValue',
                type: enumTypeNode([
                    enumTupleVariantTypeNode('u8Array', tupleTypeNode([fixedSizeTypeNode(bytesTypeNode(), 8)])),
                ]),
            }),
        ],
        name: 'kaminoLending',
        publicKey: 'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD',
    });

    const renderMap = visit(node, getRenderMapVisitor());
    await renderMapContains(renderMap, 'types/configValue.py', ['from construct import Bytes', 'Bytes(8)']);
});
