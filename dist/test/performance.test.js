"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var async_test_util_1 = require("async-test-util");
var index_1 = require("../src/index");
function randomObject() {
    return {
        foostr: async_test_util_1.randomString(),
        foobool: async_test_util_1.randomBoolean(),
        nested: {
            keyone: async_test_util_1.randomNumber(),
            deep: {
                keytwo: async_test_util_1.randomString(),
                keythree: async_test_util_1.randomString()
            }
        },
        objectarray: [{
                keyone: async_test_util_1.randomString()
            }, {
                keyone: async_test_util_1.randomString()
            }]
    };
}
var schema = {
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
var benchmark = {
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
describe('performance.test.js', function () {
    it('.createCompressionTable()', function () {
        // prepare
        var startTime = async_test_util_1.performanceNow();
        // run
        for (var i = 0; i < benchmark.createCompressionTable.amount; i++) {
            var table = index_1.createCompressionTable(schema);
            // console.dir(table);
        }
        var elapsed = async_test_util_1.performanceNow() - startTime;
        // track
        benchmark.createCompressionTable.total = elapsed;
        benchmark.createCompressionTable.perInstance = elapsed / benchmark.createCompressionTable.amount;
        // process.exit();
    });
    it('.compress()', function () {
        // prepare
        var startTime = async_test_util_1.performanceNow();
        var table = index_1.createCompressionTable(schema);
        var objects = new Array(benchmark.compress.amount).fill(0).map(function () { return randomObject(); });
        for (var i = 0; i < objects.length; i++) {
            var compressed = index_1.compressObject(table, objects[i]);
            // console.dir(compressed);
        }
        var elapsed = async_test_util_1.performanceNow() - startTime;
        benchmark.compress.total = elapsed;
        benchmark.compress.perObject = elapsed / benchmark.compress.amount;
    });
    it('.decompress()', function () {
        // prepare
        var startTime = async_test_util_1.performanceNow();
        var table = index_1.createCompressionTable(schema);
        var compressedObjects = new Array(benchmark.decompress.amount).fill(0)
            .map(function () { return randomObject(); })
            .map(function (obj) { return index_1.compressObject(table, obj); });
        var x = [];
        for (var i = 0; i < compressedObjects.length; i++) {
            console.dir(compressedObjects[i]);
            var decompressed = index_1.decompressObject(table, compressedObjects[i]);
            x.push(decompressed);
            console.dir(decompressed);
        }
        var elapsed = async_test_util_1.performanceNow() - startTime;
        benchmark.decompress.total = elapsed;
        benchmark.decompress.perObject = elapsed / benchmark.decompress.amount;
    });
    it('show results:', function () {
        console.log(JSON.stringify(benchmark, null, 2));
    });
});
//# sourceMappingURL=performance.test.js.map