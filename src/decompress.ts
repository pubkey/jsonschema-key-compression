import type {
    PlainJsonObject,
    CompressionTable
} from './types';

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
        const ret: PlainJsonObject = {};
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

    /**
        * keys could be array-accessors like myArray[4]
        * we have to split and readd the squared brackets value
        */
    const splitSquaredBrackets = key.split('[');
    key = splitSquaredBrackets.shift() as string;

    const decompressed = table.uncompressedToCompressed.get(key);
    if (!decompressed) {
        return key;
    } else {
        const readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return decompressed + readdSquared;
    }
}
