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

describe('performance.test.ts', () => {
    it('.createCompressionTable()', () => {
        // prepare
        const startTime = performanceNow();

        // run
        for (let i = 0; i < benchmark.createCompressionTable.amount; i++) {
            const table = createCompressionTable(schema);
            // console.dir(table);
        }
        const elapsed = performanceNow() - startTime;

        // track
        benchmark.createCompressionTable.total = elapsed;
        benchmark.createCompressionTable.perInstance = elapsed / benchmark.createCompressionTable.amount;
        // process.exit();
    });
    it('.compress()', () => {
        // prepare
        const startTime = performanceNow();
        const table = createCompressionTable(schema);
        const objects = new Array(benchmark.compress.amount).fill(0).map(
            () => randomObject()
        );

        for (const object of objects) {
            const compressed = compressObject(table, object);
            // console.dir(compressed);
        }

        const elapsed = performanceNow() - startTime;
        benchmark.compress.total = elapsed;
        benchmark.compress.perObject = elapsed / benchmark.compress.amount;
    });
    it('.decompress()', () => {
        // prepare
        const startTime = performanceNow();
        const table = createCompressionTable(schema);
        const compressedObjects = new Array(benchmark.decompress.amount).fill(0)
            .map(() => randomObject())
            .map(obj => compressObject(table, obj));

        const x: any[] = [];
        for (const compressedObject of compressedObjects) {
            // console.dir(compressedObjects[i]);
            const decompressed = decompressObject(table, compressedObject);
            x.push(decompressed);
            // console.dir(decompressed);
        }

        const elapsed = performanceNow() - startTime;
        benchmark.decompress.total = elapsed;
        benchmark.decompress.perObject = elapsed / benchmark.decompress.amount;
    });
    it('show results:', () => {
        console.log(JSON.stringify(benchmark, null, 2));
    });
});
