import {
    PlainJsonObject,
    CompressionTable
} from '../types/index';

/**
 * compress the keys of an object via the compression-table
 * @recursive
 */
export function compressObject(
    table: CompressionTable,
    obj: PlainJsonObject
): PlainJsonObject {
    if (typeof obj !== 'object' || obj === null) return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj
            .map(o => compressObject(table, o));
    } else {
        // object
        const ret = {};
        Object.keys(obj).forEach(key => {
            const compressedKey = compressedAndFlaggedKey(
                table,
                key
            );
            const value = compressObject(
                table,
                obj[key]
            );
            ret[compressedKey] = value;
        });
        return ret;
    }
}

/**
 * transform an object-path
 * into its compressed version
 * e.g:
 * - input: 'name.firstName'
 * - ouput: '|a.|b'
 */
export function compressPath(
    table: CompressionTable,
    path: string
): string {
    const splitted = path.split('.');
    return splitted
        .map(subKey => {
            const compressedKey = compressedAndFlaggedKey(
                table,
                subKey
            );
            return compressedKey;
        }).join('.');
}

export function throwErrorIfCompressionFlagUsed(
    table: CompressionTable,
    key: string
) {
    if (key.startsWith(table.compressionFlag)) {
        throw new Error(
            'cannot compress objects that start with the compression-flag: ' +
            table.compressionFlag + ' on key ' + key
        );
    }
}

export function compressedAndFlaggedKey(
    table: CompressionTable,
    key: string
): string {
    throwErrorIfCompressionFlagUsed(
        table,
        key
    );
    const compressedKey = table.compressedToUncompressed.get(key);
    if (!compressedKey) {
        return key;
    } else {
        return table.compressionFlag + compressedKey;
    }
}