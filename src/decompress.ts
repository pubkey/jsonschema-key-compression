import {
    PlainJsonObject,
    CompressionTable
} from '../types/index';

export function decompressObject(
    table: CompressionTable,
    obj: PlainJsonObject
): PlainJsonObject {
    if (typeof obj !== 'object' || obj === null) return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj.map(item => decompressObject(table, item));
    } else {
        // object
        const ret = {};
        Object.keys(obj).forEach(key => {
            const decompressed = decompressedKey(
                table,
                key
            );
            const value = decompressObject(
                table,
                obj[key]
            );
            ret[decompressed] = value;
        });
        return ret;
    }
}

/**
 * transform a compressed object-path
 * into its non-compressed version
 * e.g:
 * - input: '|a.|b'
 * - output: 'name.firstName'
 */
export function decompressedPath(
    table: CompressionTable,
    path: string
): string {
    const splitted = path.split('.');
    return splitted
        .map(subKey => {
            const compressedKey = decompressedKey(
                table,
                subKey
            );
            return compressedKey;
        }).join('.');
}

export function decompressedKey(
    table: CompressionTable,
    key: string
): string {
    const decompressedKey = table.uncompressedToCompressed.get(key);
    if (!decompressedKey) {
        return key;
    } else {
        return decompressedKey;
    }
}