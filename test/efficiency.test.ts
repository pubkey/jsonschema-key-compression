import {
    createCompressionTable,
    compressObject
} from '../src/index';

import {
    randomObject,
    schema
} from './helper';

import { gzip } from 'node-gzip';
const benchmark: any = {};

describe('efficiency.test.js', () => {
    const rawObject = randomObject();
    console.dir(rawObject);
    const compressionTable = createCompressionTable(schema);
    it('raw json', async () => {
        const string = JSON.stringify(rawObject);
        console.dir(string);
        benchmark.rawJson = string.length;
    });
    it('gzip only', async () => {
        const compressed: Uint8Array = await gzip(JSON.stringify(rawObject));
        benchmark.gzipOnly = compressed.length;
    });
    it('key compression', async () => {
        const compressed: string = JSON.stringify(compressObject(compressionTable, rawObject));
        console.log(compressed);
        benchmark.keyCompression = compressed.length;
    });

    it('key compression plus gzip', async () => {
        const compressed: Uint8Array = await gzip(
            JSON.stringify(
                compressObject(compressionTable, rawObject)
            )
        );
        benchmark.keyCompressionPlusGzip = compressed.length;
    });


    it('show results:', () => {
        console.log(JSON.stringify(benchmark, null, 2));
    });
});