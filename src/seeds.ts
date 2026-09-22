import { BytesValueNode, PdaSeedNode, StringValueNode } from '@codama/nodes';

import { hexToPyB } from './getTypeManifestVisitor';
function parseIntegerFormat(format: string): { length: number; signed: boolean } | null {
    // 'u64' -> 8 unsigned bytes, 'i32' -> 4 signed bytes. Floats and shortU16 are not integer seeds.
    const match = /^([ui])(8|16|32|64|128)$/.exec(format);
    if (!match) return null;
    return { length: parseInt(match[2], 10) / 8, signed: match[1] === 'i' };
}
function pyBytesLiteral(value: string): string {
    return `b"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
export function getSeed(seed: PdaSeedNode): string {
    try {
        if (seed.kind === 'constantPdaSeedNode') {
            if (seed.type.kind === 'bytesTypeNode') {
                const hexStr = hexToPyB((seed.value as BytesValueNode).data);
                return `b"${hexStr}"`;
            }
            if (seed.type.kind === 'stringTypeNode' && seed.type.encoding === 'utf8' && seed.value.kind === 'stringValueNode') {
                return pyBytesLiteral((seed.value as StringValueNode).string);
            }
            console.warn(`Unsupported constant seed type: ${seed.type.kind}`);
            return '';
        } else if (seed.kind === 'variablePdaSeedNode') {
            if (seed.type.kind === 'publicKeyTypeNode') {
                return `bytes(${seed.name})`;
            }
            if (seed.type.kind === 'stringTypeNode' && seed.type.encoding === 'utf8') {
                return `${seed.name}.encode("utf-8")`;
            }
            if (seed.type.kind === 'numberTypeNode') {
                const integer = parseIntegerFormat(seed.type.format);
                if (integer) {
                    const signed = integer.signed ? ', signed=True' : '';
                    return `${seed.name}.to_bytes(${integer.length}, byteorder='little'${signed})`;
                }
            }
            if (seed.type.kind === 'enumTypeNode') {
                return `bytes([${seed.name}.discriminator])`;
            }
            if (seed.type.kind === 'definedTypeLinkNode') {
                return `bytes([${seed.name}.discriminator])`;
            }
            if (seed.type.kind === 'fixedSizeTypeNode') {
                return seed.name;
            }
            return '';
        }
        return '';
    } catch (error) {
        console.warn(`Error generating seed for ${seed.kind}:`, error);
        return '';
    }
}
export function getSeedType(seed: PdaSeedNode): string {
    if (seed.kind === 'variablePdaSeedNode') {
        switch (seed.type.kind) {
            case 'publicKeyTypeNode':
                return 'SolPubkey';
            case 'numberTypeNode':
                return 'int';
            case 'stringTypeNode':
                return 'str';
            case 'bytesTypeNode':
                return 'bytes';
            case 'enumTypeNode':
                return 'typing.Any';
            case 'definedTypeLinkNode':
                return 'typing.Any';
            case 'fixedSizeTypeNode':
                return 'bytes';
            default:
                console.warn(`Unsupported seed type: ${seed.type.kind}`);
                return 'typing.Any';
        }
    }
    return '';
}
