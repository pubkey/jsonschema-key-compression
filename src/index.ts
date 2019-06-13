import {
    PlainJsonObject,
    CompressionTable,
    JsonSchema,
    TableType
} from '../types/index';
import {
    numberToLetter,
    trimDots,
    alphabeticCompare
} from './util';

export {
    createCompressionTable
} from './create-compression-table';

/**
   * compress the keys of an object via the compression-table
   * @param {Object} obj
   * @param {Object} compressed obj
   */
export function compress(table: CompressionTable, obj: PlainJsonObject): PlainJsonObject {
    return _compressObj(table, obj);
}


export function _decompressObj(table: CompressionTable, obj: PlainJsonObject) {
    const reverseTable = table.uncompressedToCompressed;

    // non-object
    if (typeof obj !== 'object' || obj === null) return obj;

    // array
    if (Array.isArray(obj))
        return obj.map(item => _decompressObj(table, item));

    // object
    else {
        const ret = {};
        Object.keys(obj).forEach(key => {
            let replacedKey = key;
            if (
                (
                    key.startsWith('|') ||
                    key.startsWith('_')
                ) &&
                reverseTable[key]
            ) replacedKey = reverseTable[key];

            ret[replacedKey] = _decompressObj(table, obj[key]);
        });
        return ret;
    }
}


export function decompress(table: CompressionTable, obj: PlainJsonObject): PlainJsonObject {
    const returnObj = _decompressObj(table, obj);
    return returnObj;
}

/**
 * get the full compressed-key-path of a object-path
 * @param {string} prePath | 'mainSkill'
 * @param {string} prePathCompressed | '|a'
 * @param {string[]} remainPathAr | ['attack', 'count']
 * @return {string} compressedPath | '|a.|b.|c'
 */
export function transformKey(
    table: CompressionTable,
    prePath: string,
    prePathCompressed: string,
    remainPathAr: string[]
): string {
    prePath = trimDots(prePath);
    prePathCompressed = trimDots(prePathCompressed);
    const nextPath = remainPathAr.shift();

    const nextFullPath = trimDots(prePath + '.' + nextPath);
    if (table[nextFullPath])
        prePathCompressed += '.' + table[nextFullPath];
    else prePathCompressed += '.' + nextPath;

    if (remainPathAr.length > 0)
        return transformKey(table, nextFullPath, prePathCompressed, remainPathAr);
    else
        return trimDots(prePathCompressed);
}

export function _compressObj(
    table: CompressionTable,
    obj: PlainJsonObject,
    path: string = ''
) {
    const ret = {};
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
        return obj
            .map(o => _compressObj(table, o, trimDots(path + '.item')));
    }
    const compressedTable = table.compressedToUncompressed;
    Object.keys(obj).forEach(key => {
        const propertyObj = obj[key];
        const fullPath = trimDots(path + '.' + key);
        const replacedKey = compressedTable[fullPath] ? compressedTable[fullPath] : key;
        let nextObj = propertyObj;
        nextObj = _compressObj(table, propertyObj, fullPath);
        ret[replacedKey] = nextObj;
    });
    return ret;
}