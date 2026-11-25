import * as assert from 'assert';
import {
    decompressObject,
    compressObject,
    compressedPath,
    decompressedPath,
    createCompressionTable
} from '../../src/index';
import {
    getDefaultCompressionTable,
    getDefaultObject,
    getDefaultCompressedObject,
    getDefaultSchema
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
        ['__proto__', 'constructor', 'toString', 'hasOwnProperty'].forEach(specialKey => {
            it('turnarround should keep the key ' + specialKey + ' as own property', () => {
                const table = getDefaultCompressionTable();
                const input = JSON.parse(
                    '{"' + specialKey + '":{"length":3,"type":"text/plain"},' +
                    '"nestedObject":{"' + specialKey + '":{"length":3,"type":"text/plain"}}}'
                );
                const result: any = decompressObject(
                    table,
                    compressObject(table, input)
                );
                assert.deepStrictEqual(Object.keys(result), [specialKey, 'nestedObject']);
                assert.deepStrictEqual(Object.keys(result.nestedObject), [specialKey]);
                assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
                assert.strictEqual(Object.getPrototypeOf(result.nestedObject), Object.prototype);
                assert.strictEqual(result.length, undefined);
                assert.strictEqual(result.nestedObject.length, undefined);
                assert.deepStrictEqual(result, input);
                assert.strictEqual(JSON.stringify(result), JSON.stringify(input));
            });
            it('turnarround should keep the key ' + specialKey + ' of an object inside of an array', () => {
                const table = getDefaultCompressionTable();
                const input = JSON.parse(
                    '{"objectArray":[{"keyone":"foo","' + specialKey + '":{"length":3}},' +
                    '[{"' + specialKey + '":1}]]}'
                );
                const result: any = decompressObject(
                    table,
                    compressObject(table, input)
                );
                assert.deepStrictEqual(Object.keys(result.objectArray[0]), ['keyone', specialKey]);
                assert.deepStrictEqual(Object.keys(result.objectArray[1][0]), [specialKey]);
                assert.strictEqual(Object.getPrototypeOf(result.objectArray[0]), Object.prototype);
                assert.strictEqual(Object.getPrototypeOf(result.objectArray[1][0]), Object.prototype);
                assert.strictEqual(result.objectArray[0].length, undefined);
                assert.deepStrictEqual(result, input);
                assert.strictEqual(JSON.stringify(result), JSON.stringify(input));
            });
        });
        it('should keep the key __proto__ of an already compressed object as own property', () => {
            const table = getDefaultCompressionTable();
            const nestedKey = compressedPath(table, 'nestedObject');
            const compressed = JSON.parse(
                '{"__proto__":{"length":3},"' + nestedKey + '":{"__proto__":{"length":3}}}'
            );
            const result: any = decompressObject(table, compressed);
            assert.deepStrictEqual(Object.keys(result), ['__proto__', 'nestedObject']);
            assert.deepStrictEqual(Object.keys(result.nestedObject), ['__proto__']);
            assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
            assert.strictEqual(Object.getPrototypeOf(result.nestedObject), Object.prototype);
            assert.strictEqual(result.length, undefined);
            assert.deepStrictEqual(
                result,
                JSON.parse('{"__proto__":{"length":3},"nestedObject":{"__proto__":{"length":3}}}')
            );
        });
        it('turnarround should keep the key __proto__ when it is a property of the schema', () => {
            const schema = getDefaultSchema();
            Object.defineProperty(schema.properties, '__proto__', {
                value: { type: 'object' },
                enumerable: true,
                writable: true,
                configurable: true
            });
            const table = createCompressionTable(schema);
            const input = JSON.parse('{"__proto__":{"length":3},"name":"foo"}');
            const result: any = decompressObject(
                table,
                compressObject(table, input)
            );
            assert.deepStrictEqual(Object.keys(result), ['__proto__', 'name']);
            assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
            assert.deepStrictEqual(result, input);
        });
        it('should not have changed Object.prototype', () => {
            assert.strictEqual(({} as any).length, undefined);
            assert.strictEqual(({} as any).type, undefined);
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
