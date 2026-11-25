import * as assert from 'assert';
import {
    compressObject,
    compressedPath,
    compressQuerySelector,
    compressQuery,
    createCompressionTable,
    MangoQuery
} from '../../src/index';
import {
    getDefaultCompressionTable,
    getDefaultObject,
    getDefaultSchema
} from './test-util';

describe('compress.test.ts', () => {
    describe('.compressObject()', () => {
        it('should not throw', () => {
            const compressed = compressObject(
                getDefaultCompressionTable(),
                getDefaultObject()
            );
            assert.ok(compressed);
        });
        it('should have a compressed attribute', () => {
            const table = getDefaultCompressionTable();
            const compressed = compressObject(
                table,
                getDefaultObject()
            );
            assert.ok(
                Object.keys(compressed).
                    find(key => key.startsWith(table.compressionFlag))
            );
        });
        it('should not have compressed the attribute thats in not in the schema', () => {
            const compressed = compressObject(
                getDefaultCompressionTable(),
                getDefaultObject()
            );
            assert.ok((compressed as any)['notInSchema']);
        });
        it('should not have compressed the attribute that is too short', () => {
            const compressed = compressObject(
                getDefaultCompressionTable(),
                getDefaultObject()
            );
            assert.ok((compressed as any)['id']);
        });
        it('should throw when the object contains an attribute that starts with the compression-flag', () => {
            const table = getDefaultCompressionTable();
            const obj = getDefaultObject();
            (obj as any)[table.compressionFlag + 'foo'] = 'bar';
            assert.throws(
                () => compressObject(
                    table,
                    obj
                )
            );
        });
        ['__proto__', 'constructor', 'toString', 'hasOwnProperty'].forEach(specialKey => {
            it('should keep the key ' + specialKey + ' as own property', () => {
                const table = getDefaultCompressionTable();
                const input = JSON.parse(
                    '{"' + specialKey + '":{"length":3,"type":"text/plain"},' +
                    '"nestedObject":{"' + specialKey + '":{"length":3,"type":"text/plain"}},' +
                    '"objectArray":[{"' + specialKey + '":{"length":3}}]}'
                );
                const compressed: any = compressObject(table, input);
                const nestedKey = compressedPath(table, 'nestedObject');
                const arrayKey = compressedPath(table, 'objectArray');
                assert.deepStrictEqual(
                    Object.keys(compressed),
                    [specialKey, nestedKey, arrayKey]
                );
                assert.deepStrictEqual(Object.keys(compressed[nestedKey]), [specialKey]);
                assert.deepStrictEqual(Object.keys(compressed[arrayKey][0]), [specialKey]);
                assert.strictEqual(Object.getPrototypeOf(compressed), Object.prototype);
                assert.strictEqual(Object.getPrototypeOf(compressed[nestedKey]), Object.prototype);
                assert.strictEqual(Object.getPrototypeOf(compressed[arrayKey][0]), Object.prototype);
                assert.strictEqual(compressed.length, undefined);
                assert.strictEqual(compressed[nestedKey].length, undefined);
                assert.strictEqual(
                    JSON.stringify(compressed),
                    JSON.stringify(input)
                        .replace('nestedObject', nestedKey)
                        .replace('objectArray', arrayKey)
                );
            });
        });
        it('should compress the key __proto__ when it is a property of the schema', () => {
            const schema = getDefaultSchema();
            Object.defineProperty(schema.properties, '__proto__', {
                value: { type: 'object' },
                enumerable: true,
                writable: true,
                configurable: true
            });
            const table = createCompressionTable(schema);
            const compressedKey = compressedPath(table, '__proto__');
            assert.ok(compressedKey.startsWith(table.compressionFlag));
            const input = JSON.parse('{"__proto__":{"length":3}}');
            const compressed: any = compressObject(table, input);
            assert.deepStrictEqual(Object.keys(compressed), [compressedKey]);
            assert.deepStrictEqual(compressed[compressedKey], { length: 3 });
        });
    });
    describe('.compressedPath()', () => {
        it('should not throw', () => {
            const compressed = compressedPath(
                getDefaultCompressionTable(),
                'nestedObject.nestedAttribute'
            );
            assert.ok(compressed.length > 3);
        });
        it('should only contain compressed keys', () => {
            const table = getDefaultCompressionTable();
            const compressed = compressedPath(
                table,
                'nestedObject.nestedAttribute'
            );
            const split = compressed.split('.');
            split.forEach(
                k => assert.ok(
                    k.startsWith(
                        table.compressionFlag
                    )
                )
            );
        });
        it('should not loose keys', () => {
            const table = getDefaultCompressionTable();
            const compressed = compressedPath(
                table,
                'nestedObject.nestedAttribute.deepNestedAttribute'
            );
            const split = compressed.split('.');
            assert.equal(split.length, 3);
        });
        it('should not have compressed the attribute thats in not in the schema', () => {
            const compressed = compressedPath(
                getDefaultCompressionTable(),
                'notInSchema.deepNestedAttribute'
            );
            assert.ok(compressed.startsWith('notInSchema.'));
        });
        it('should throw when the object contains an attribute that starts with the compression-flag', () => {
            const table = getDefaultCompressionTable();
            assert.throws(
                () => compressedPath(
                    table,
                    'nestedObject.|foobar'
                )
            );
        });
        it('should be able to compress array-paths', () => {
            const table = getDefaultCompressionTable();
            const compressed = compressedPath(
                table,
                'objectArray[1].deepNested'
            );
            assert.ok(compressed.includes('[1]'));
            assert.ok(compressed.startsWith(table.compressionFlag));
        });
    });
    describe('.compressQuerySelector()', () => {
        it('should compress the selector', () => {
            const selector = {
                'active': {
                    $eq: true
                }
            };
            const table = getDefaultCompressionTable();
            const compressed = compressQuerySelector(
                table,
                selector
            );
            assert.deepEqual(
                compressed,
                { '|a': { $eq: true } }
            );
        });
        it('deeper nested', () => {
            const selector = {
                $and: [
                    {
                        active: true
                    },
                    {
                        'nestedObject.nestedAttribute': {
                            $ne: 'foobar'
                        }
                    }
                ]
            };
            const table = getDefaultCompressionTable();
            const compressed = compressQuerySelector(
                table,
                selector
            );
            assert.deepEqual(
                compressed,
                {
                    $and: [
                        {
                            '|a': true
                        },
                        {
                            '|g.|f': {
                                $ne: 'foobar'
                            }
                        }
                    ]
                }
            );
        });
        it('should keep the key __proto__ as own property', () => {
            const table = getDefaultCompressionTable();
            const selector = JSON.parse('{"__proto__":{"$eq":"foo"},"name":{"__proto__":{"$eq":"foo"}}}');
            const compressed = compressQuerySelector(table, selector);
            const nameKey = compressedPath(table, 'name');
            assert.deepStrictEqual(Object.keys(compressed), ['__proto__', nameKey]);
            assert.deepStrictEqual(Object.keys(compressed[nameKey]), ['__proto__']);
            assert.strictEqual(Object.getPrototypeOf(compressed), Object.prototype);
            assert.strictEqual(Object.getPrototypeOf(compressed[nameKey]), Object.prototype);
            assert.strictEqual(compressed.$eq, undefined);
            assert.strictEqual(
                JSON.stringify(compressed),
                JSON.stringify(selector).replace('name', nameKey)
            );
        });
    });
    describe('.compressQuery()', () => {
        it('should compress all attributes', () => {
            const query: MangoQuery = {
                selector: {
                    $and: [
                        {
                            active: true
                        },
                        {
                            'nestedObject.nestedAttribute': {
                                $ne: 'foobar'
                            }
                        }
                    ]
                },
                skip: 1,
                limit: 1,
                fields: [
                    'id',
                    'name'
                ],
                sort: [
                    'name',
                    '-active'
                ]
            };

            const table = getDefaultCompressionTable();
            const compressed = compressQuery(
                table,
                query
            );
            assert.deepEqual(
                compressed,
                {
                    selector: {
                        $and: [
                            {
                                '|a': true
                            },
                            {
                                '|g.|f': {
                                    $ne: 'foobar'
                                }
                            }
                        ]
                    },
                    skip: 1,
                    limit: 1,
                    fields: [
                        'id',
                        '|e'
                    ],
                    sort: [
                        '|e',
                        '-|a'
                    ]
                }
            );
        });
        it('should work with sort-objects', () => {
            const query: MangoQuery = {
                selector: {},
                sort: [
                    { 'name': 1 },
                    { 'active': -1 }
                ]
            };

            const table = getDefaultCompressionTable();
            const compressed = compressQuery(
                table,
                query
            );
            assert.deepEqual(
                compressed.sort,
                [{ '|e': 1 }, { '|a': -1 }]
            );
        });
        it('should work with sort-object', () => {
            const query: MangoQuery = {
                selector: {},
                sort: {
                    name: 'asc',
                    active: 'desc'
                }
            };

            const table = getDefaultCompressionTable();
            const compressed = compressQuery(
                table,
                query
            );

            assert.deepStrictEqual(
                compressed.sort,
                { '|e': 'asc', '|a': 'desc' }
            );
        });
        it('should keep the key __proto__ of a sort-object as own property', () => {
            const table = getDefaultCompressionTable();
            const query: MangoQuery = {
                selector: {},
                sort: JSON.parse('{"__proto__":"asc","name":"desc"}')
            };
            const compressed = compressQuery(table, query);
            assert.deepStrictEqual(
                Object.keys(compressed.sort as any),
                ['__proto__', compressedPath(table, 'name')]
            );
            assert.strictEqual(Object.getPrototypeOf(compressed.sort), Object.prototype);
            assert.strictEqual((compressed.sort as any)['__proto__'], 'asc');
        });
        it('should work with regex', () => {

            /**
             * stringify filter to print regexes
             * @link https://stackoverflow.com/a/38251445
             */
            function stringifyFilter(_key: string, value: any) {
                if (value instanceof RegExp) {
                    return value.toString();
                }

                return value;
            }


            const query: MangoQuery = {
                selector: {
                    name: {
                        $regex: /foobar/i
                    }
                }
            };
            const table = getDefaultCompressionTable();
            const compressed = compressQuery(
                table,
                query
            );
            const compressedString = JSON.stringify(compressed, stringifyFilter);
            assert.ok(compressedString.includes('foobar'));
        });
    });
});
