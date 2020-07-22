"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./types"), exports);
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
//# sourceMappingURL=index.js.map