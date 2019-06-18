import * as assert from 'assert';
import {
    randomString,
    randomBoolean,
    randomNumber,
    performanceNow
} from 'async-test-util';

import {
    createCompressionTable,
    compressObject,
    decompressObject
} from '../src/index';
import {
    PlainJsonObject
} from '../types/json-object';
import {
    JsonSchema
} from '../types/schema';

function randomObject(): PlainJsonObject {
    return {
        foostr: randomString(),
        foobool: randomBoolean(),
        nested: {
            keyone: randomNumber(),
            deep: {
                keytwo: randomString(),
                keythree: randomString()
            }
        },
        objectarray: [{
            keyone: randomString()
        }, {
            keyone: randomString()
        }]
    };
}

const schema: JsonSchema = {
    type: 'object',
    properties: {
        foostr: {
            type: 'string'
        },
        foobool: {
            type: 'boolean'
        },
        nested: {
            type: 'string'
        },
        objectarray: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    keyone: {
                        type: 'string'
                    }
                }
            }
        },
    }
};

const benchmark = {
    notice: 'times are in milliseconds',
    createCompressionTable: {
        amount: 1000,
        total: 0,
        perInstance: 0
    },
    compress: {
        amount: 1000,
        total: 0,
        perObject: 0
    },
    decompress: {
        amount: 1000,
        total: 0,
        perObject: 0
    }
};

describe('performance.test.js', () => {
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

        for (let i = 0; i < objects.length; i++) {
            const compressed = compressObject(table, objects[i]);
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
        for (let i = 0; i < compressedObjects.length; i++) {
            console.dir(compressedObjects[i]);
            const decompressed = decompressObject(table, compressedObjects[i]);
            x.push(decompressed);
            console.dir(decompressed);
        }

        const elapsed = performanceNow() - startTime;
        benchmark.decompress.total = elapsed;
        benchmark.decompress.perObject = elapsed / benchmark.decompress.amount;
    });
    it('show results:', () => {
        console.log(JSON.stringify(benchmark, null, 2));
    });
});
