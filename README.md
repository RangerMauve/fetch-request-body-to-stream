# fetch-request-body-to-stream
Convert fetch request body values to a readable stream. Normalizes strings / Buffers / BufferSource / Streams / Form Data

## Supported body types:

- String
- Buffer
- ArrayBuffer
- TypedArray
- Blob
- [UploadData](https://www.electronjs.org/docs/api/structures/upload-data) (bytes/file/blobUUID)
- [WHATWG ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- Node.js Stream

## Usage

```js
const bodyToStream = require('fetch-request-body-to-stream')

const stream = bodyToStream(request.body)
```

With electron:

```js
session.protocol.registerStreamProtocol('example', (request, callback) => {
  const {uploadData} = request

  // Make sure to pass the session in to support files and blobUUIDs
  const data = bodyToStream(uploadData, session)

  callback(data)
})
```
