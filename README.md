# jsonschema-key-compression

Compress json-data based on its [json-schema](https://json-schema.org/) while still having valid json.
It works by compressing long attribute-names into smaller ones and backwards.

For example this:

```json

{
    "firstName": "Corrine",
    "lastName": "Ziemann",
    "title": "Ms.",
    "gender": "f",
    "zipCode": 75963,
    "countryCode": "en",
    "birthYear": 1960,
    "active": false,
    "shoppingCartItems": [
        {
            "productNumber": 29857,
            "amount": 1
        },
        {
            "productNumber": 53409,
            "amount": 6
        }
    ]
}
```

becomes this:

```json
{
    "|e": "Corrine",
    "|g": "Ziemann",
    "|j": "Ms.",
    "|f": "f",
    "|k": 75963,
    "|d": "en",
    "|c": 1960,
    "|a": false,
    "|i": [
        {
            "|h": 29857,
            "|b": 1
        },
        {
            "|h": 53409,
            "|b": 6
        }
    ]
}
```

## Efficiency

The efficiency depends on the amount and length of the attribute names. 
* The uncompressed json-object from above has about **230 chars** as string
* With the key-compression, this can be reduced to **140 chars** which saves about **40%**
* Just using gzip on the json would result in **180 chars**
* Using gzip+key-compression ends in a string with only **127 chars**

You can reproduce these results by running `npm run test:efficiency`.

## Performance

The compression works pretty fast. Here are some time measurements on a single intel i7 CPU.

* Creating a compression-table from the schema of the object above takes about `0.02ms`
* Compressing the example-object from above takes about `0.021ms`
* Decompressing takes about `0.027ms` per object

You can reproduce these results by running `npm run test:performance`.

## You should use this when
- you want to save storage space in an NoSQL-database but still want to have valid queryable json-data
- you transmit many objects in many small requests over the network so that gzip cannot be efficient
- you want to store json-data inside of the browser-storage (indexedDB or localstorage) and you reach the storage limit

## You should NOT use this when
- you send many objects in a single request, you should rely on gzip instead
- you do not want to still have valid json-data, you should use [protobuf](https://developers.google.com/protocol-buffers/) instead
- you have schema-less data


## Comparison with gzip

Gzip generates its compression-flags [from the input](https://en.wikipedia.org/wiki/Gzip). This makes it more efficient, the more data is compressed at once. But gzip is less efficient the smaller the dataset is.
The key-compression creates the compression-table from the jsonschema up front with has advantages when small pieces of data are compressed.

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
Compress a json-object based on its schema.

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
Transform a chain of json-attributes into its compressed format.

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
### createCompressedJsonSchema

Transforms a json-schema into a compressed form, so that it can be used to validate compressed objects.

```js
import {
    createCompressedJsonSchema
} from 'jsonschema-key-compression';


const schema = {
    type: 'object',
    properties: {
        firstName: {
            type: 'string'
        }
    },
    required: [
        'firstName'
    ]
}

const compressedSchema = createCompressedJsonSchema(
    compressionTable,
    schema
);

console.dir(compressedSchema);

/**
{
    type: 'object',
    properties: {
        |a: {
            type: 'string'
        }
    },
    required: [
        '|a'
    ]
}
 */

```
