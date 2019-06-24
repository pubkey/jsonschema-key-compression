# jsonschema-key-compression

Compress json-data based on it's [json-schema](https://json-schema.org/) while still having valid json.
It works by compressing long attribute-names into smaller ones and backwards.

For example this:

```json

{
    "firstName": "alice",
    "lastName": "wonder",
    "registerDate": "2019-06-01",
    "country": "de",
    "active": true,
    "eyeColor": "brown"
}

```

becomes this:

```json
{
    "|a": "alice",
    "|b": "wonder",
    "|c": "2019-06-01",
    "|d": "de",
    "|e": true,
    "|f": "brown"
}
```

The compressed version only needs **85 chars** while the non-compressed version needs **123 chars**. So by storing the compressed version, you can store up to 30% more data. Compression efficiency depends on the length of the attribute names.

## You should use this when
- you want to save storage space in an NoSQL-database but still want to have valid json-data
- you transmit many objects in many small requests over the network so that gzip cannot be efficient
- you want to store json-data inside of the browser-storage (indexedDB or localstorage) and you reach the storage limit

## You should NOT use this when
- you send many objects in a single request, you should rely on gzip instead
- you do not want to still have valid json-data, you should use [protobuf](https://developers.google.com/protocol-buffers/) instead
- you have schema-less data

## Usage

### Install

```bash
npm install jsonschema-key-compression --save
```

### createCompressionTable
Creates a compression-table from the [json-schema](https://json-schema.org/).

```js
import {
    createCompressionTable
} from 'jsonschema-key-compression';
const compressionTable = createCompressionTable(jsonSchema);
```

### compressObject
Compress a json-object based on it's schema.

```js
import {
    compressObject
} from 'jsonschema-key-compression';
const compressedObject = compressObject(
    compressionTable,
    jsonObject
);
```

### decompressObject
Decompress a compressed object.

```js
import {
    decompressObject
} from 'jsonschema-key-compression';
const jsonObject = decompressObject(
    compressionTable,
    compressedObject
);
```

### compressedPath
Transform a chain of json-attributes into it's compresed format.

```js
import {
    compressedPath
} from 'jsonschema-key-compression';
const compressed = compressedPath(
    compressionTable,
    'whateverNested.firstName'
); // > '|a.|b'
```

### decompressedPath
Decompress a compressed path.

```js
import {
    decompressedPath
} from 'jsonschema-key-compression';
const decompressed = decompressedPath(
    compressionTable,
    '|a.|b' // from compressedPath
); // > 'whateverNested.firstName'
```


### compressQuery
Compress a [mango-query](https://docs.mongodb.com/manual/tutorial/query-documents/) so that it can run over a NoSQL-database that has stored compressed documents.

```js
import {
    compressQuery
} from 'jsonschema-key-compression';
const compressed = compressQuery(
    compressionTable,
    {
        selector: {
            active: {
                $eq: true
            }
        },
        skip: 1,
        limit: 1,
        fields: [
            'id',
            'name'
        ],
        sort: [
            'name'
        ]
    }
);
```
