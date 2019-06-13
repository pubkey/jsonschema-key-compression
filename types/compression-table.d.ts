export type TableType = Map<string, string>;

export type CompressionTable = {
    compressedToUncompressed: TableType;
    uncompressedToCompressed: TableType;
};