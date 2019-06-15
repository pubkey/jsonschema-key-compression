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
            .map(item => compressObject(table, item));
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
 * - input: 'names[1].firstName'
 * - ouput: '|a[1].|b'
 */
export function compressedPath(
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

    /**
     * keys could be array-accessors like myArray[4]
     * we have to split and readd the squared brackets value
     */
    const splitSquaredBrackets = key.split('[');
    key = splitSquaredBrackets.shift() as string;

    const compressedKey = table.compressedToUncompressed.get(key);
    if (!compressedKey) {
        return key;
    } else {
        const readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return table.compressionFlag + compressedKey + readdSquared;
    }
}