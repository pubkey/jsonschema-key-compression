import type {
    PlainJsonObject,
    PlainJsonObjectNotArray,
    CompressionTable,
    MangoQuery
} from './types';

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
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index] as string;
        const value = (obj as PlainJsonObjectNotArray)[key];
        // primitives do not need a recursive call
        ret[compressedAndFlaggedKey(table, key)] = (typeof value === 'object' && value !== null) ?
            compressObject(table, value) :
            value;
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
 * @recursive
 */
export function compressQuerySelector(
    table: CompressionTable,
    selector: any
): any {
    if (Array.isArray(selector)) {
        return selector.map(item => compressQuerySelector(table, item));
    } else if (selector instanceof RegExp) {
        return selector;
    } else if (typeof selector === 'object' && selector !== null) {
        const ret: any = {};
        Object.keys(selector).forEach(key => {
            let useKey;
            if (key.startsWith('$')) {
                // operator
                useKey = key;
            } else {
                // property path
                useKey = compressedPath(
                    table,
                    key
                );
            }
            ret[useKey] = compressQuerySelector(
                table,
                selector[key]
            );
        });
        return ret;
    } else {
        return selector;
    }
}
