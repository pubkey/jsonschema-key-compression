import * as assert from 'assert';
import {
    decompressObject,
    compressObject,
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
    });
});