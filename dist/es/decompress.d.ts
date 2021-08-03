import type { PlainJsonObject, CompressionTable } from './types';
export declare function decompressObject(table: CompressionTable, obj: PlainJsonObject): PlainJsonObject;
/**
 * transform a compressed object-path
 * into its non-compressed version
 * e.g:
 * - input: '|a.|b'
 * - output: 'name.firstName'
 */
export declare function decompressedPath(table: CompressionTable, path: string): string;
export declare function decompressedKey(table: CompressionTable, key: string): string;
