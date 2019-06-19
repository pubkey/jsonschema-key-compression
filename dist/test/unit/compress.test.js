"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var index_1 = require("../../src/index");
var test_util_1 = require("./test-util");
describe('compress.test.ts', function () {
    describe('.compressObject()', function () {
        it('should not throw', function () {
            var compressed = index_1.compressObject(test_util_1.getDefaultCompressionTable(), test_util_1.getDefaultObject());
            assert.ok(compressed);
        });
        it('should have a compressed attribute', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressObject(table, test_util_1.getDefaultObject());
            assert.ok(Object.keys(compressed).
                find(function (key) { return key.startsWith(table.compressionFlag); }));
        });
        it('should not have compressed the attribute thats in not in the schema', function () {
            var compressed = index_1.compressObject(test_util_1.getDefaultCompressionTable(), test_util_1.getDefaultObject());
            assert.ok(compressed['notInSchema']);
        });
        it('should not have compressed the attribute that is too short', function () {
            var compressed = index_1.compressObject(test_util_1.getDefaultCompressionTable(), test_util_1.getDefaultObject());
            assert.ok(compressed['id']);
        });
        it('should throw when the object contains an attribute that starts with the compression-flag', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var obj = test_util_1.getDefaultObject();
            obj[table.compressionFlag + 'foo'] = 'bar';
            assert.throws(function () { return index_1.compressObject(table, obj); });
        });
    });
    describe('.compressedPath()', function () {
        it('should not throw', function () {
            var compressed = index_1.compressedPath(test_util_1.getDefaultCompressionTable(), 'nestedObject.nestedAttribute');
            assert.ok(compressed.length > 3);
        });
        it('should only contain compressed keys', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressedPath(table, 'nestedObject.nestedAttribute');
            var split = compressed.split('.');
            split.forEach(function (k) { return assert.ok(k.startsWith(table.compressionFlag)); });
        });
        it('should not loose keys', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressedPath(table, 'nestedObject.nestedAttribute.deepNestedAttribute');
            var split = compressed.split('.');
            assert.equal(split.length, 3);
        });
        it('should not have compressed the attribute thats in not in the schema', function () {
            var compressed = index_1.compressedPath(test_util_1.getDefaultCompressionTable(), 'notInSchema.deepNestedAttribute');
            assert.ok(compressed.startsWith('notInSchema.'));
        });
        it('should throw when the object contains an attribute that starts with the compression-flag', function () {
            var table = test_util_1.getDefaultCompressionTable();
            assert.throws(function () { return index_1.compressedPath(table, 'nestedObject.|foobar'); });
        });
        it('should be able to compress array-paths', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressedPath(table, 'objectArray[1].deepNested');
            assert.ok(compressed.includes('[1]'));
            assert.ok(compressed.startsWith(table.compressionFlag));
        });
    });
    describe('.compressQuerySelector()', function () {
        it('should compress the selector', function () {
            var selector = {
                'active': {
                    $eq: true
                }
            };
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressQuerySelector(table, selector);
            assert.deepEqual(compressed, { '|a': { $eq: true } });
        });
        it('deeper nested', function () {
            var selector = {
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
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressQuerySelector(table, selector);
            assert.deepEqual(compressed, {
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
            });
        });
    });
    describe('.compressQuery()', function () {
        it('should compress all attributes', function () {
            var query = {
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
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressQuery(table, query);
            assert.deepEqual(compressed, {
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
            });
        });
        it('should work with sort-objects', function () {
            var query = {
                selector: {},
                sort: [
                    { 'name': 1 },
                    { '-active': -1 }
                ]
            };
            var table = test_util_1.getDefaultCompressionTable();
            var compressed = index_1.compressQuery(table, query);
            assert.deepEqual(compressed.sort, [{ '|e': 1 }, { '-active': -1 }]);
        });
    });
});
//# sourceMappingURL=compress.test.js.map