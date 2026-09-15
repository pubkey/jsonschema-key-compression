import type {
    PlainJsonObject,
    PlainJsonObjectNotArray,
    CompressionTable,
    MangoQuery
} from './types';
import { compressEnumValue } from './enum-compression';

/**
 * compress the keys of an object via the compression-table
 * @recursive
 */
export function compressObject(
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
            retArray[index] = (typeof item === 'object' && item !== null) ? compressObject(table, item) as any : item;
        }
        return retArray;
    }
    // object
    const ret: PlainJsonObjectNotArray = {};
    const keys = Object.keys(obj);
    const enumCompression = table.enumCompression;
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index] as string;
        const value = (obj as PlainJsonObjectNotArray)[key];
        const enumValues = enumCompression && enumCompression.get(key);
        if (enumValues && (typeof value === 'string' || Array.isArray(value))) {
            ret[compressedAndFlaggedKey(table, key)] = compressEnumValue(enumValues, value);
        } else {
            // primitives do not need a recursive call
            ret[compressedAndFlaggedKey(table, key)] = (typeof value === 'object' && value !== null) ?
                compressObject(table, value) :
                value;
        }
    }
    return ret;
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

/**
 * Cache of the flagged compressed keys per table,
 * so that the flag does not have to be concatenated on each use.
 * The cache is keyed by the table object, so a table must not be
 * mutated after it has been used for compression.
 */
const flaggedKeysCache: WeakMap<CompressionTable, Map<string, string>> = new WeakMap();
function getFlaggedKeys(table: CompressionTable): Map<string, string> {
    let flaggedKeys = flaggedKeysCache.get(table);
    if (!flaggedKeys) {
        const newFlaggedKeys: Map<string, string> = new Map();
        table.compressedToUncompressed.forEach((compressedKey, key) => {
            newFlaggedKeys.set(key, table.compressionFlag + compressedKey);
        });
        flaggedKeysCache.set(table, newFlaggedKeys);
        flaggedKeys = newFlaggedKeys;
    }
    return flaggedKeys;
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
     * so the part before the squared bracket is looked up
     * and the bracket part is re-added.
     * Most keys have no bracket, so the plain lookup is the fast path.
     */
    const flaggedKeys = getFlaggedKeys(table);
    const bracketIndex = key.indexOf('[');
    if (bracketIndex === -1) {
        const directFlaggedKey = flaggedKeys.get(key);
        return directFlaggedKey ? directFlaggedKey : key;
    }
    const plainKey = key.slice(0, bracketIndex);
    const flaggedKey = flaggedKeys.get(plainKey);
    if (!flaggedKey) {
        return key;
    }
    return flaggedKey + key.slice(bracketIndex);
}


/**
 * compress a mango-query
 * so that it can be used to find documents
 * in a database where all documents are compressed
 */
export function compressQuery(
    table: CompressionTable,
    query: MangoQuery
): MangoQuery {
    const ret: MangoQuery = {
        selector: compressQuerySelector(
            table,
            query.selector
        )
    };
    if (query.skip) ret.skip = query.skip;
    if (query.limit) ret.limit = query.limit;

    if (query.fields) {
        ret.fields = query.fields
            .map(field => compressedPath(
                table,
                field
            ));
    }

    if (query.sort) {
        if (Array.isArray(query.sort)) {
            ret.sort = (query.sort as any[]).map((item: string | any) => {
                if (typeof item === 'string') {
                    const hasMinus = item.startsWith('-');
                    if (hasMinus) {
                        item = item.substr(1);
                    }
                    let compressedField = compressedPath(
                        table,
                        item
                    );
                    if (hasMinus) {
                        compressedField = '-' + compressedField;
                    }
                    return compressedField;
                } else {
                    return compressQuerySelector(
                        table,
                        item
                    );
                }
            });
        } else {
            const compressedSort: any = {};
            // do not use Object.entries, it is transpiled shitty
            Object.keys(query.sort).forEach(key => {
                const direction = (query as any).sort[key];
                const compressedField = compressedPath(
                    table,
                    key
                );
                compressedSort[compressedField] = direction;
            });
            ret.sort = compressedSort;
        }
    }
    return ret;
}

/**
 * Operators whose value is a document-value and therefore
 * has to be enum-compressed like the documents themselves.
 * Any other operator, like $type or $mod, gets its value unchanged.
 */
const ENUM_VALUE_OPERATORS: string[] = [
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$in',
    '$nin',
    '$all',
    '$not',
    '$elemMatch'
];

/**
 * Returns the enum of the property that the path points to,
 * or undefined when that property is not enum-compressed.
 */
function enumValuesOfPath(
    table: CompressionTable,
    path: string
): string[] | undefined {
    const enumCompression = table.enumCompression;
    if (!enumCompression) {
        return undefined;
    }
    const splitted = path.split('.');
    let lastKey = splitted[splitted.length - 1] as string;
    const bracketIndex = lastKey.indexOf('[');
    if (bracketIndex !== -1) {
        lastKey = lastKey.slice(0, bracketIndex);
    }
    return enumCompression.get(lastKey);
}

/**
 * A regular expression cannot run on the compressed number of an enum-value,
 * so it is resolved up front into the indexes of the matching enum-values.
 */
function enumIndexesOfRegex(
    enumValues: string[],
    pattern: any,
    options: any
): number[] {
    let source: string;
    let flags: string;
    if (pattern instanceof RegExp) {
        source = pattern.source;
        flags = (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '');
    } else {
        source = String(pattern);
        flags = '';
    }
    if (typeof options === 'string') {
        flags = options;
    }
    /**
     * The global flags make .test() stateful
     * and are meaningless for a full check of a single value.
     */
    flags = flags.replace(/[gy]/g, '');
    const regex = new RegExp(source, flags);
    const indexes: number[] = [];
    for (let i = 0; i < enumValues.length; i++) {
        if (regex.test(enumValues[i] as string)) {
            indexes.push(i);
        }
    }
    return indexes;
}

/**
 * @recursive
 * @param enumValues The enum of the property that the selector belongs to,
 * so that the compared values can be enum-compressed.
 */
export function compressQuerySelector(
    table: CompressionTable,
    selector: any,
    enumValues?: string[]
): any {
    if (Array.isArray(selector)) {
        return selector.map(item => compressQuerySelector(table, item, enumValues));
    } else if (selector instanceof RegExp) {
        return selector;
    } else if (typeof selector === 'object' && selector !== null) {
        const ret: any = {};
        /**
         * $regex and its $options are replaced by a single $in
         * with the indexes of the matching enum-values.
         */
        let regexIndexes: number[] | undefined;
        if (enumValues && typeof selector['$regex'] !== 'undefined') {
            regexIndexes = enumIndexesOfRegex(
                enumValues,
                selector['$regex'],
                selector['$options']
            );
        }
        Object.keys(selector).forEach(key => {
            if (regexIndexes && (key === '$regex' || key === '$options')) {
                return;
            }
            let useKey;
            let useEnumValues;
            if (key.startsWith('$')) {
                // operator
                useKey = key;
                useEnumValues = ENUM_VALUE_OPERATORS.indexOf(key) === -1 ? undefined : enumValues;
            } else {
                // property path
                useKey = compressedPath(
                    table,
                    key
                );
                useEnumValues = enumValuesOfPath(
                    table,
                    key
                );
            }
            const value = selector[key];
            if (useEnumValues && value instanceof RegExp) {
                ret[useKey] = {
                    $in: enumIndexesOfRegex(useEnumValues, value, undefined)
                };
            } else {
                ret[useKey] = compressQuerySelector(
                    table,
                    value,
                    useEnumValues
                );
            }
        });
        if (regexIndexes) {
            const alreadyIn = ret['$in'];
            ret['$in'] = Array.isArray(alreadyIn) ?
                regexIndexes.filter(index => alreadyIn.includes(index)) :
                regexIndexes;
        }
        return ret;
    } else {
        if (enumValues) {
            return compressEnumValue(enumValues, selector);
        }
        return selector;
    }
}
