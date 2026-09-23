import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import { InstructionArgumentNode, isNode, StructFieldTypeNode } from '@codama/nodes';
import { pascalCase } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { TypeManifest } from '../TypeManifest';
import { notPyKeyCase } from '../utils';
import { renderString } from '../utils/render';
import { PyFragment } from './common';

// Helper function to process fields and avoid duplicated logic
function processFields<T>(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
    processFn: (
        field: InstructionArgumentNode | StructFieldTypeNode,
        fieldType: TypeManifest,
        imports: ImportMap,
    ) => T | null,
): { fragments: T[]; imports: ImportMap } {
    const { fields, typeManifestVisitor } = scope;
    const fragments: T[] = [];
    const imports = new ImportMap();

    fields.forEach((field, _index) => {
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }

        const fieldType = visit(field.type, typeManifestVisitor);
        const result = processFn(field, fieldType, imports);

        if (result !== null) {
            fragments.push(result);
        }
    });

    return { fragments, imports };
}

export function getFieldsJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fragments, imports } = processFields(scope, (field, fieldType, imports) => {
        if (fieldType.pyJSONType) {
            imports.mergeWith(fieldType.pyJSONType);
            return `${notPyKeyCase(field.name)}: ${fieldType.pyJSONType.render}`;
        } else {
            throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: field.kind, node: field });
        }
    });

    return new PyFragment(fragments, imports);
}

export function getFieldsPy(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fragments } = processFields(scope, (field, fieldType) => {
        return `${notPyKeyCase(field.name)}: ${fieldType.pyType.render}`;
    });

    return new PyFragment(fragments);
}

export function getFieldsPyJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    try {
        fields.forEach((field, _index) => {
            if (field.name.toLowerCase().includes('discriminator')) {
                return;
            }
            const fieldtype = visit(field.type, typeManifestVisitor);
            if (fieldtype.pyJSONType.render) {
                fragments.push(`${field.name}: ${fieldtype.pyJSONType.render}`);
            } else {
                throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: field.kind, node: field });
            }
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('field.name', err.stack, fields);
        }
    }
    return new PyFragment(fragments);
}

export function getFieldsToJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fragments, imports } = processFields(scope, (field, fieldType, imports) => {
        imports.mergeWith(fieldType.toJSON);
        const toCastStr = renderString(fieldType.toJSON.render, { name: 'self.' + notPyKeyCase(field.name) });
        return `"${notPyKeyCase(field.name)}": ${toCastStr}`;
    });

    return new PyFragment(fragments, imports);
}

export function getFieldsToJSONEncodable(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        if (field.type.kind == 'definedTypeLinkNode' && fieldtype.isEncodable) {
            const toCastStr = renderString('{{name}}.to_encodable()', { name: 'self.' + field.name });
            fragments.push(`"${field.name}": ${toCastStr}`);
        } else {
            const JSONEncodeableStr = renderString(fieldtype.toEncode.render, {
                name: `self.${notPyKeyCase(field.name)}`,
            });
            fragments.push(`"${field.name}": ${JSONEncodeableStr}`);
        }
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsDecode(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }
        if (field.type.kind == 'definedTypeLinkNode') {
            const fieldtype = visit(field.type, typeManifestVisitor);
            imports.mergeWith(fieldtype.toJSON);
            if (fieldtype.isEnum) {
                fragments.push(`${field.name}=types.${field.type.name}.from_decoded(dec.${field.name})`);
            } else {
                fragments.push(
                    `${field.name}=types.${field.type.name}.${pascalCase(field.type.name)}.from_decoded(dec.${field.name})`,
                );
            }
        } else {
            const fieldtype = visit(field.type, typeManifestVisitor);
            const fromCastStr = renderString(fieldtype.fromDecode.render, { name: `dec.${notPyKeyCase(field.name)}` });
            fragments.push(`${notPyKeyCase(field.name)}=${fromCastStr}`);
        }
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsFromJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fragments, imports } = processFields(scope, (field, fieldType, imports) => {
        imports.mergeWith(fieldType.fromJSON);
        const fromCastStr = renderString(fieldType.fromJSON.render, {
            name: 'obj["' + notPyKeyCase(field.name) + '"]',
        });
        return `${notPyKeyCase(field.name)}=${fromCastStr}`;
    });

    return new PyFragment(fragments, imports);
}

export function getFieldsFromDecode(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.fromDecode);
        const fromCastStr = renderString(fieldtype.fromDecode.render, { name: 'obj["' + field.name + '"]' });
        fragments.push(`${notPyKeyCase(field.name)}=${fromCastStr}`);
    });
    return new PyFragment(fragments, imports);
}

/**
 * Instruction arguments whose type is an inline tuple (e.g. a single-use Rust newtype
 * such as `struct OptionU64(u64)`, which Codama inlines into the instruction).
 * The generic tuple manifest is written for enum tuple variants (`self.value[i]`),
 * so instruction args need their own layout and encoding.
 */
export function getInlineTupleArg(
    field: InstructionArgumentNode | StructFieldTypeNode,
    typeManifestVisitor: GlobalFragmentScope['typeManifestVisitor'],
): { encode: (expr: string) => string; imports: ImportMap; layout: string; pyType: string } | null {
    if (!isNode(field, 'instructionArgumentNode') || !isNode(field.type, 'tupleTypeNode')) {
        return null;
    }
    const imports = new ImportMap();
    const items = field.type.items.map(item => visit(item, typeManifestVisitor));
    items.forEach(item => imports.mergeWith(item.borshType, item.pyType));
    const encodeItem = (item: TypeManifest, expr: string) =>
        item.isEncodable ? `${expr}.to_encodable()` : renderString(item.toEncode?.render || '{{name}}', { name: expr });
    const single = items.length === 1;
    return {
        // Single-item tuples keep the flat Python type (e.g. `int`) that Codama users already see.
        encode: expr =>
            single
                ? `[${encodeItem(items[0], expr)}]`
                : `[${items.map((item, i) => encodeItem(item, `${expr}[${i}]`)).join(', ')}]`,
        imports,
        layout: `borsh.TupleStruct(${items.map(item => item.borshType.render).join(', ')})`,
        pyType: single ? items[0].pyType.render : `typing.Tuple[${items.map(item => item.pyType.render).join(', ')}]`,
    };
}

export function getArgsToLayout(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }
        const inlineTuple = getInlineTupleArg(field, typeManifestVisitor);
        if (inlineTuple) {
            fragments.push(`"${field.name}":${inlineTuple.encode('args["' + field.name + '"]')}`);
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.fromDecode);
        let toCastStr = '';
        if (fieldtype.isEncodable) {
            toCastStr = renderString('{{name}}.to_encodable()', { name: 'args["' + field.name + '"]' });
        } else {
            toCastStr = renderString(fieldtype.toEncode.render, { name: 'args["' + field.name + '"]' });
        }

        fragments.push(`"${field.name}":${toCastStr}`);
    });
    return new PyFragment(fragments);
}

export function getArgsToPy(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fragments, imports } = processFields(scope, (field, fieldType, imports) => {
        const inlineTuple = getInlineTupleArg(field, scope.typeManifestVisitor);
        if (inlineTuple) {
            imports.mergeWith(inlineTuple.imports);
            return `${field.name}:${inlineTuple.pyType}`;
        }
        imports.mergeWith(fieldType.pyType);
        return `${field.name}:${fieldType.pyType.render}`;
    });

    return new PyFragment(fragments, imports);
}
