import * as assert from 'assert';
import {
    compressObject,
    compressedPath
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
    });
});