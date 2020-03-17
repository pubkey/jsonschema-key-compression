"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var create_compression_table_1 = require("./create-compression-table");
exports.createCompressionTable = create_compression_table_1.createCompressionTable;
exports.DEFAULT_COMPRESSION_FLAG = create_compression_table_1.DEFAULT_COMPRESSION_FLAG;
var compress_1 = require("./compress");
exports.compressObject = compress_1.compressObject;
exports.compressedPath = compress_1.compressedPath;
exports.compressQuerySelector = compress_1.compressQuerySelector;
exports.compressQuery = compress_1.compressQuery;
var decompress_1 = require("./decompress");
exports.decompressObject = decompress_1.decompressObject;
exports.decompressedPath = decompress_1.decompressedPath;
//# sourceMappingURL=index.js.map