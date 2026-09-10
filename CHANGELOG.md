# Changelog

## Unreleased

- FIX: `createCompressedJsonSchema()` did not compress the `properties`, `required` and `items` of nested schemas whose `type` is a type-array like `['object', 'null']` or `['array', 'null']`, or whose `type` is omitted. Because `createCompressionTable()` and `compressObject()` do compress these keys, a compressed object did not validate against its compressed schema.
- FIX: `createCompressedJsonSchema()` did not compress property names inside of `allOf`, `anyOf`, `oneOf`, `not`, `patternProperties`, `additionalItems`, `dependencies` and `definitions`. The compression-table is not changed by this, so already compressed data stays compatible.
- FIX: `createCompressionTable()` with `ignoreProperties` removed the decompression entry of a different property when an ignored property name was equal to a generated compressed key like `b`. `decompressObject()` then left that key compressed.
- FIX: `createCompressedJsonSchema()` did not compress object values inside of `enum`. A property with an enum of allowed objects rejected every compressed document, because the enum still listed the uncompressed property names.
- FIX: The performance test measured the creation of the random test-data (and for decompress also the compression) as part of the compress and decompress timings, which reported about 2 to 3 times too high numbers. The timer now only covers the measured operation, after an untimed warm-up. The benchmark schema also describes `shoppingCartItems` as an array now, like the test-data has it.
- PERFORMANCE: `compressObject()` is about 60% faster and `decompressObject()` about 50% faster. Keys are looked up directly instead of being split on `[` for every key, the flagged compressed keys are cached per compression-table instead of being concatenated on every use, and primitive values are no longer passed through a recursive call.
- PERFORMANCE: `createCompressionTable()` is about 30% faster because the property names of nested schemas are collected into a single set instead of creating a new set and array copy on each nesting level.
- ADD: A general consistency test that runs random mango-queries (via mingo) and schema validation (via ajv) on random documents of a complex schema, to ensure that compressed and non-compressed data behave the same.
