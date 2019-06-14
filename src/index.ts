export {
    PlainJsonObject,
    CompressionTable,
    JsonSchema,
    TableType
} from '../types/index';

export {
    createCompressionTable,
    DEFAULT_COMPRESSION_FLAG
} from './create-compression-table';
export {
    compressObject,
    compressedPath
} from './compress';

export {
    decompressObject,
    decompressedPath
} from './decompress';