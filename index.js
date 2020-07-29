const { Readable } = require('stream')

module.exports = function bodyToStream (body, ses) {
  // If there's no body, give an empty stream
  if (!body) return intoStream(Buffer.from('', 'utf8'))

  // Probably a node stream
  if(isFn(body.pipe)) return body

  // Account for blob
  if (isFn(body.stream)) {
    const stream = body.stream()
    return streamIntoStream(stream)
  }
  if (isFn(body.arrayBuffer)) {
    return promiseIntoStream(body.arrayBuffer())
  }

  // Account for WHATWG Readable Stream
  if (isFn(body.getReader)) {
    return streamIntoStream(body)
  }

  // Account for electron's UploadData object
  // https://www.electronjs.org/docs/api/structures/upload-data
  if (body.bytes) {
    return intoStream(body.bytes)
  }
  if (body.file) {
    if (!ses) throw new Error('Must specify session for electron file upload')
    const fs = require('fs')
    return fs.createReadStream(body.file)
  }
  if (body.blobUUID) {
    if (!ses) throw new Error('Must specify session for blobUUIDs')
    return promiseIntoStream(ses.getBlobData(body.blobUUID))
  }

  // Probably a string or a buffer of some sort?
  return intoStream(Buffer.from(body))
}

function isFn(value) {
  return typeof value === 'function'
}

async function streamIntoStream (stream) {
  if (stream.getIterator) {
    return asyncIteratorIntoStream(stream.getIterator())
  } else {
    return asyncIteratorIntoStream(consumeStream(stream))
  }
}

async function * consumeStream (stream) {
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    yield value
  }
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}

function promiseIntoStream (promise) {
  return new Readable({
    read () {
      promise.then((data) => {
        this.push(data)
        this.push(null)
      }, (err) => {
        this.emit('error', err)
        this.push(null)
      })
    }
  })
}

function asyncIteratorIntoStream (iterable) {
  return new Readable({
    async read () {
      try {
        for await (const data of iterable) {
          this.push(data)
        }
      } catch (e) {
        this.emit('error', e)
      }
      this.push(null)
    }
  })
}
