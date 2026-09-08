import {
    performanceNow
} from 'async-test-util';

import {
    randomObject,
    schema
} from './helper';

import {
    createCompressionTable,
    compressObject,
    decompressObject
} from '../src/index';

const benchmark = {
    notice: 'times are in milliseconds',
    createCompressionTable: {
        amount: 10000,
        total: 0,
        perInstance: 0
    },
    compress: {
        amount: 10000,
        total: 0,
        perObject: 0
    },
    decompress: {
        amount: 10000,
        total: 0,
        perObject: 0
    }
};

/**
 * Results are pushed into a sink
 * so that the engine cannot optimize away the measured calls.
 */
const sink: any[] = [];

/**
 * Untimed warm-up iterations, so that the measurement
 * does not include the JIT compilation of the measured functions.
 */
const WARMUP_AMOUNT = 1000;

describe('performance.test.ts', () => {
    it('.createCompressionTable()', () => {
        // prepare
        for (let i = 0; i < WARMUP_AMOUNT; i++) {
            sink.push(createCompressionTable(schema));
        }
        sink.length = 0;

        // run
        const startTime = performanceNow();
        for (let i = 0; i < benchmark.createCompressionTable.amount; i++) {
            sink.push(createCompressionTable(schema));
        }
        const elapsed = performanceNow() - startTime;
        sink.length = 0;

        // track
        benchmark.createCompressionTable.total = elapsed;
        benchmark.createCompressionTable.perInstance = elapsed / benchmark.createCompressionTable.amount;
    });
    it('.compress()', () => {
        // prepare, this must not be part of the measurement
        const table = createCompressionTable(schema);
        const objects = new Array(benchmark.compress.amount).fill(0).map(
            () => randomObject()
        );
        for (let i = 0; i < WARMUP_AMOUNT; i++) {
            sink.push(compressObject(table, objects[i] as any));
        }
        sink.length = 0;

        // run
        const startTime = performanceNow();
        for (const object of objects) {
            sink.push(compressObject(table, object));
        }
        const elapsed = performanceNow() - startTime;
        sink.length = 0;

        // track
        benchmark.compress.total = elapsed;
        benchmark.compress.perObject = elapsed / benchmark.compress.amount;
    });
    it('.decompress()', () => {
        // prepare, this must not be part of the measurement
        const table = createCompressionTable(schema);
        const compressedObjects = new Array(benchmark.decompress.amount).fill(0)
            .map(() => randomObject())
            .map(obj => compressObject(table, obj));
        for (let i = 0; i < WARMUP_AMOUNT; i++) {
            sink.push(decompressObject(table, compressedObjects[i] as any));
        }
        sink.length = 0;

        // run
        const startTime = performanceNow();
        for (const compressedObject of compressedObjects) {
            sink.push(decompressObject(table, compressedObject));
        }
        const elapsed = performanceNow() - startTime;
        sink.length = 0;

        // track
        benchmark.decompress.total = elapsed;
        benchmark.decompress.perObject = elapsed / benchmark.decompress.amount;
    });
    it('show results:', () => {
        console.log(JSON.stringify(benchmark, null, 2));
    });
});
