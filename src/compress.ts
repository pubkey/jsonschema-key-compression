import type {
    PlainJsonObject,
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
    else if (Array.isArray(obj)) {
        // array
        return obj
            .map(item => compressObject(table, item));
    } else {
        // object
        const ret: PlainJsonObject = {};
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
            Object.entries(query.sort).forEach(([key, direction]) => {
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
