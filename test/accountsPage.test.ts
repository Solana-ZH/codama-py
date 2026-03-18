import {
  accountNode,
  arrayTypeNode,
  booleanTypeNode,
  constantDiscriminatorNode,
  constantValueNodeFromBytes,
  definedTypeLinkNode,
  definedTypeNode,
  enumEmptyVariantTypeNode,
  enumStructVariantTypeNode,
  enumTypeNode,
  enumValueNode,
  fieldDiscriminatorNode,
  fixedCountNode,
  numberTypeNode,
  numberValueNode,
  prefixedCountNode,
  programNode,
  publicKeyTypeNode,
  remainderCountNode,
  structFieldTypeNode,
  structTypeNode,
} from "@codama/nodes";
import { visit } from "@codama/visitors-core";
import { test } from "vitest";

import { getRenderMapVisitor } from "../src";
import { renderMapContains } from "./_setup";
/*
test('it renders PDA helpers for PDA with no seeds', async () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        accounts: [accountNode({ name: 'foo', pda: pdaLinkNode('bar') })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'bar', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following fetch helper functions delegating to findBarPda.
    await renderMapContains(renderMap, 'accounts/foo.ts', [
        'export async function fetchFooFromSeeds',
        'export async function fetchMaybeFooFromSeeds',
        'await findBarPda({ programAddress })',
    ]);
});*/

test("it renders an account with a defined type link as discriminator", async () => {
  // Given the following program with 1 account with a discriminator.
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            defaultValue: enumValueNode("key", "Asset"),
            defaultValueStrategy: "omitted",
            name: "key",
            type: definedTypeLinkNode("Key"),
          }),
          structFieldTypeNode({
            name: "mutable",
            type: booleanTypeNode(),
          }),
          structFieldTypeNode({
            name: "owner",
            type: publicKeyTypeNode(),
          }),
        ]),
        discriminators: [fieldDiscriminatorNode("key", 0)],
        name: "asset",
      }),
    ],
    definedTypes: [
      definedTypeNode({
        name: "key",
        type: enumTypeNode([
          enumEmptyVariantTypeNode("Uninitialized"),
          enumEmptyVariantTypeNode("Asset"),
        ]),
      }),
    ],
    name: "splToken",
    publicKey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  });

  const renderMap = visit(node, getRenderMapVisitor());
  //console.log(renderMap.get('accounts/asset.py'));

  // Then we expect the following import list with a reference to the disciminator type.
  await renderMapContains(renderMap, "accounts/asset.py", [
    "from ..program_id import SPL_TOKEN_PROGRAM_ADDRESS",
    `from .. import types`,
    `key: types.key.KeyJSON`,
  ]);
});

test("it renders constants for account field discriminators", async () => {
  // Given the following account with a field discriminator.
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            defaultValue: numberValueNode(42),
            defaultValueStrategy: "omitted",
            name: "myDiscriminator",
            type: numberTypeNode("u64"),
          }),
        ]),
        discriminators: [fieldDiscriminatorNode("myDiscriminator")],
        name: "myAccount",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  // When we render it.
  const renderMap = visit(node, getRenderMapVisitor());
  //console.log(renderMap.get('accounts/myAccount.py'));

  // Then we expect the following constant and function to be rendered
  // And we expect the field default value to use that constant.

  await renderMapContains(renderMap, "accounts/myAccount.py", [
    'myDiscriminator: typing.ClassVar = b"\\x2a\\x00\\x00\\x00\\x00\\x00\\x00\\x00"',
    "if data[:cls.DISCRIMINATOR_SIZE] != cls.myDiscriminator:",
  ]);
});

test("it renders constants for account constant discriminators", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        discriminators: [
          constantDiscriminatorNode(
            constantValueNodeFromBytes("base16", "1111"),
          ),
          constantDiscriminatorNode(
            constantValueNodeFromBytes("base16", "2222"),
            2,
          ),
        ],
        name: "myAccount",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  // When we render it.
  const renderMap = visit(node, getRenderMapVisitor());
  console.log(renderMap.get("accounts/myAccount.py"));
  // Then we expect the following constants and functions to be rendered.
  await renderMapContains(renderMap, "accounts/myAccount.py", [
    "layout: typing.ClassVar = borsh.CStruct(",
    'discriminator_0: typing.ClassVar = b"\\x11\\x11"',
    'discriminator_2: typing.ClassVar = b"\\x22\\x22"',
    "if data[:cls.DISCRIMINATOR_SIZE] != cls.discriminator_0+cls.discriminator_2:",
  ]);
});

test("it renders u32 for account field discriminators", async () => {
  // Given the following account.
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({ name: "value", type: numberTypeNode("u32") }),
        ]),
        name: "counter",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  // When we render it using the following custom account data options.
  const renderMap = visit(node, getRenderMapVisitor({}));

  await renderMapContains(renderMap, "accounts/counter.py", [
    '"value" /borsh.U32,',
    "value: int",
  ]);
});

test("it decodes fixed-size primitive arrays without conversion", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            name: "name",
            type: arrayTypeNode(numberTypeNode("u8"), fixedCountNode(32)),
          }),
        ]),
        name: "primitiveArray",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "accounts/primitiveArray.py", [
    `"name" / borsh.U8[32],`,
    `name=dec.name,`,
  ]);
});

test("it decodes vec of defined structs using from_decoded", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            name: "items",
            type: arrayTypeNode(
              definedTypeLinkNode("item"),
              prefixedCountNode(numberTypeNode("u32")),
            ),
          }),
        ]),
        name: "bag",
      }),
    ],
    definedTypes: [
      definedTypeNode({
        name: "kind",
        type: enumTypeNode([
          enumEmptyVariantTypeNode("A"),
          enumStructVariantTypeNode(
            "B",
            structTypeNode([
              structFieldTypeNode({
                name: "value",
                type: numberTypeNode("u8"),
              }),
            ]),
          ),
        ]),
      }),
      definedTypeNode({
        name: "item",
        type: structTypeNode([
          structFieldTypeNode({
            name: "kind",
            type: definedTypeLinkNode("kind"),
          }),
        ]),
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "accounts/bag.py", [
    `items=list(map(lambda item:types.item.Item.from_decoded(item),dec.items)),`,
  ]);
  await renderMapContains(renderMap, "accounts/bag.py", [
    `items=list(map(lambda item:types.item.Item.from_json(item),obj["items"])),`,
  ]);
});

test("it decodes vec of defined enums using from_decoded", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            name: "items",
            type: arrayTypeNode(
              definedTypeLinkNode("kind"),
              prefixedCountNode(numberTypeNode("u32")),
            ),
          }),
        ]),
        name: "enumBag",
      }),
    ],
    definedTypes: [
      definedTypeNode({
        name: "kind",
        type: enumTypeNode([
          enumEmptyVariantTypeNode("A"),
          enumStructVariantTypeNode(
            "B",
            structTypeNode([
              structFieldTypeNode({
                name: "value",
                type: numberTypeNode("u8"),
              }),
            ]),
          ),
        ]),
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "accounts/enumBag.py", [
    `items=list(map(lambda item:types.kind.from_decoded(item),dec.items)),`,
  ]);
  await renderMapContains(renderMap, "accounts/enumBag.py", [
    `items=list(map(lambda item:types.kind.from_json(item),obj["items"])),`,
  ]);
});

test("it decodes remainder primitive arrays without conversion", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            name: "items",
            type: arrayTypeNode(numberTypeNode("u8"), remainderCountNode()),
          }),
        ]),
        name: "remainingBytes",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "accounts/remainingBytes.py", [
    `"items" / GreedyRange(typing.cast(Construct, borsh.U8)),`,
    `items=dec.items,`,
    `items=obj["items"],`,
  ]);
});

test("it decodes remainder public key arrays without conversion", async () => {
  const node = programNode({
    accounts: [
      accountNode({
        data: structTypeNode([
          structFieldTypeNode({
            name: "keys",
            type: arrayTypeNode(publicKeyTypeNode(), remainderCountNode()),
          }),
        ]),
        name: "remainingKeys",
      }),
    ],
    name: "myProgram",
    publicKey: "1111",
  });

  const renderMap = visit(node, getRenderMapVisitor());

  await renderMapContains(renderMap, "accounts/remainingKeys.py", [
    `"keys" / GreedyRange(typing.cast(Construct, BorshPubkey)),`,
    `keys=dec.keys,`,
    `keys=list(map(lambda item:SolPubkey.from_string(item),obj["keys"])),`,
  ]);
});
