"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var index_1 = require("../../src/index");
var test_util_1 = require("./test-util");
describe('decompress.test.ts', function () {
    describe('.decompressObject()', function () {
        it('should not throw', function () {
            var compressed = index_1.decompressObject(test_util_1.getDefaultCompressionTable(), test_util_1.getDefaultCompressedObject());
            assert.ok(compressed);
        });
        it('turnarround should output an equal object', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var obj = test_util_1.getDefaultObject();
            var compressed = index_1.compressObject(table, obj);
            var decompressed = index_1.decompressObject(table, compressed);
            assert.deepEqual(obj, decompressed);
        });
    });
    describe('.decompressedPath()', function () {
        it('should not throw', function () {
            var compressed = index_1.decompressedPath(test_util_1.getDefaultCompressionTable(), '|foo.|bar.|car');
            assert.ok(compressed.length > 3);
        });
        it('should compress all parts', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var path = 'nestedObject.nestedAttribute';
            var compressed = index_1.compressedPath(table, path);
            var split = compressed.split('.');
            split.forEach(function (p) { return assert.ok(p.startsWith(table.compressionFlag)); });
        });
        it('turnarround should output an equal path', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var path = 'nestedObject.nestedAttribute';
            var compressed = index_1.compressedPath(table, path);
            var decompressed = index_1.decompressedPath(table, compressed);
            assert.equal(path, decompressed);
        });
        it('should be able to compress array-paths', function () {
            var table = test_util_1.getDefaultCompressionTable();
            var path = 'objectArray[1].deepNested';
            var compressed = index_1.compressedPath(table, path);
            var decompressed = index_1.decompressedPath(table, compressed);
            assert.equal(path, decompressed);
        });
    });
});
//# sourceMappingURL=decompress.test.js.map