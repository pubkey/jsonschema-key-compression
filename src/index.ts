import {
    JsonSchema
} from '../types/schema';
import {
    PlainJsonObject
} from '../types/json-object';
import {
    numberToLetter,
    trimDots
} from './util';

type TableType = Map<string, string>;

export type CompressionTable = {
    compressedToUncompressed: TableType;
    uncompressedToCompressed: TableType;
};

export function createCompressionTable(schema: JsonSchema): CompressionTable {
    const table = _compressedToUncompressedTable(schema);
    const compressionTable: CompressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: reverseTable(table)
    };

    return compressionTable;
}


export function _compressedToUncompressedTable(schema: JsonSchema): TableType {
    let lastKeyNumber = 0;
    const nextKey = () => {
        lastKeyNumber++;
        return numberToLetter(lastKeyNumber - 1);
    };
    const table: TableType = new Map();

    const propertiesToTable = (path, obj) => {
        Object.keys(obj).map(key => {
            const propertyObj = obj[key];
            const fullPath = (key === 'properties') ? path : trimDots(path + '.' + key);
            if (
                typeof propertyObj === 'object' && // do not add schema-attributes
                !Array.isArray(propertyObj) && // do not use arrays
                !table.has(fullPath) &&
                fullPath !== '' &&
                key.length > 3 && // do not compress short keys
                !fullPath.startsWith('_') // _id/_rev etc should never be compressed
            ) table.set(fullPath, '|' + nextKey());

            // primary-key is always compressed to _id
            if (propertyObj.primary === true)
                table.set(fullPath, '_id');

            if (typeof propertyObj === 'object' && !Array.isArray(propertyObj))
                propertiesToTable(fullPath, propertyObj);
        });
    };
    propertiesToTable('', schema);
    return table;
}

export function reverseTable(table: TableType): TableType {
    const reverseTable: TableType = new Map();
    Array.from(table.keys()).forEach(key => {
        const value = table.get(key) as string;
        const fieldName = key.split('.').pop() as string;
        reverseTable.set(value, fieldName);
    });
    return reverseTable;
}


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