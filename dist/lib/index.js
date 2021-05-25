"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompressedJsonSchema = exports.decompressedPath = exports.decompressObject = exports.compressQuery = exports.compressQuerySelector = exports.compressedPath = exports.compressObject = exports.DEFAULT_COMPRESSION_FLAG = exports.createCompressionTable = void 0;
var create_compression_table_1 = require("./create-compression-table");
Object.defineProperty(exports, "createCompressionTable", { enumerable: true, get: function () { return create_compression_table_1.createCompressionTable; } });
Object.defineProperty(exports, "DEFAULT_COMPRESSION_FLAG", { enumerable: true, get: function () { return create_compression_table_1.DEFAULT_COMPRESSION_FLAG; } });
var compress_1 = require("./compress");
Object.defineProperty(exports, "compressObject", { enumerable: true, get: function () { return compress_1.compressObject; } });
Object.defineProperty(exports, "compressedPath", { enumerable: true, get: function () { return compress_1.compressedPath; } });
Object.defineProperty(exports, "compressQuerySelector", { enumerable: true, get: function () { return compress_1.compressQuerySelector; } });
Object.defineProperty(exports, "compressQuery", { enumerable: true, get: function () { return compress_1.compressQuery; } });
var decompress_1 = require("./decompress");
Object.defineProperty(exports, "decompressObject", { enumerable: true, get: function () { return decompress_1.decompressObject; } });
Object.defineProperty(exports, "decompressedPath", { enumerable: true, get: function () { return decompress_1.decompressedPath; } });
var create_compressed_json_schema_1 = require("./create-compressed-json-schema");
Object.defineProperty(exports, "createCompressedJsonSchema", { enumerable: true, get: function () { return create_compressed_json_schema_1.createCompressedJsonSchema; } });
//# sourceMappingURL=index.js.map