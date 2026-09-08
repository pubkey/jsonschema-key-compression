import type {
    PlainJsonObject,
    PlainJsonObjectNotArray,
    CompressionTable
} from './types';

export function decompressObject(
    table: CompressionTable,
    obj: PlainJsonObject
): PlainJsonObject {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
        // array
        const retArray: PlainJsonObjectNotArray[] = new Array(obj.length);
        for (let index = 0; index < obj.length; index++) {
            const item = obj[index];
            // primitives do not need a recursive call
            retArray[index] = (typeof item === 'object' && item !== null) ? decompressObject(table, item) as any : item;
        }
        return retArray;
    }
    // object
    const ret: PlainJsonObjectNotArray = {};
    const keys = Object.keys(obj);
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index] as string;
        const value = (obj as PlainJsonObjectNotArray)[key];
        // primitives do not need a recursive call
        ret[decompressedKey(table, key)] = (typeof value === 'object' && value !== null) ?
            decompressObject(table, value) :
            value;
    }
    return ret;
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

    /**
     * keys could be array-accessors like myArray[4]
     * so the part before the squared bracket is looked up
     * and the bracket part is re-added.
     * Most keys have no bracket, so the plain lookup is the fast path.
     */
    const bracketIndex = key.indexOf('[');
    if (bracketIndex === -1) {
        const directDecompressed = table.uncompressedToCompressed.get(key);
        return directDecompressed ? directDecompressed : key;
    }
    const plainKey = key.slice(0, bracketIndex);
    const decompressed = table.uncompressedToCompressed.get(plainKey);
    if (!decompressed) {
        return key;
    }
    return decompressed + key.slice(bracketIndex);
}
