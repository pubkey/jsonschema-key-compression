export * from '../types/index.d';

export {
    createCompressionTable,
    DEFAULT_COMPRESSION_FLAG
} from './create-compression-table';
export {
    compressObject,
    compressedPath,
    compressQuerySelector,
    compressQuery
} from './compress';

export {
    decompressObject,
    decompressedPath,
} from './decompress';