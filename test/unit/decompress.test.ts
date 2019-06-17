import * as assert from 'assert';
import {
    decompressObject,
    compressObject,
    compressedPath,
    decompressedPath
} from '../../src/index';
import {
    getDefaultCompressionTable,
    getDefaultObject,
    getDefaultCompressedObject
} from './test-util';

describe('decompress.test.ts', () => {
    describe('.decompressObject()', () => {
        it('should not throw', () => {
            const compressed = decompressObject(
                getDefaultCompressionTable(),
                getDefaultCompressedObject()
            );
            assert.ok(compressed);
        });
        it('turnarround should output an equal object', () => {
            const table = getDefaultCompressionTable();
            const obj = getDefaultObject();
            const compressed = compressObject(
                table,
                obj
            );
            const decompressed = decompressObject(
                table,
                compressed
            );
            assert.deepEqual(
                obj,
                decompressed
            );
        });
    });
    describe('.decompressedPath()', () => {
        it('should not throw', () => {
            const compressed = decompressedPath(
                getDefaultCompressionTable(),
                '|foo.|bar.|car'
            );
            assert.ok(compressed.length > 3);
        });
        it('should compress all parts', () => {
            const table = getDefaultCompressionTable();
            const path = 'nestedObject.nestedAttribute';
            const compressed = compressedPath(
                table,
                path
            );
            const split = compressed.split('.');
            split.forEach(p => assert.ok(p.startsWith(table.compressionFlag)));
        });
        it('turnarround should output an equal path', () => {
            const table = getDefaultCompressionTable();
            const path = 'nestedObject.nestedAttribute';
            const compressed = compressedPath(
                table,
                path
            );
            const decompressed = decompressedPath(
                table,
                compressed
            );
            assert.equal(
                path,
                decompressed
            );
        });
        it('should be able to compress array-paths', () => {
            const table = getDefaultCompressionTable();
            const path = 'objectArray[1].deepNested';
            const compressed = compressedPath(
                table,
                path
            );
            const decompressed = decompressedPath(
                table,
                compressed
            );
            assert.equal(
                path,
                decompressed
            );
        });

    });
});
