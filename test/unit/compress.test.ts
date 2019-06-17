import * as assert from 'assert';
import {
    compressObject,
    compressedPath,
    compressQuerySelector,
    compressQuery,
    MangoQuery
} from '../../src/index';
import {
    getDefaultCompressionTable,
    getDefaultObject
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
            assert.ok(compressed['notInSchema']);
        });
        it('should not have compressed the attribute that is too short', () => {
            const compressed = compressObject(
                getDefaultCompressionTable(),
                getDefaultObject()
            );
            assert.ok(compressed['id']);
        });
        it('should throw when the object contains an attribute that starts with the compression-flag', () => {
            const table = getDefaultCompressionTable();
            const obj = getDefaultObject();
            obj[table.compressionFlag + 'foo'] = 'bar';
            assert.throws(
                () => compressObject(
                    table,
                    obj
                )
            );
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
                    { '-active': -1 }
                ]
            };

            const table = getDefaultCompressionTable();
            const compressed = compressQuery(
                table,
                query
            );
            assert.deepEqual(
                compressed.sort,
                [{ '|e': 1 }, { '-active': -1 }]
            );
        });
    });
});
