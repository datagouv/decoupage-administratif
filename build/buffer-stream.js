const {PassThrough} = require('stream')

function bufferToStream(buffer) {
  const stream = new PassThrough()
  stream.push(buffer)
  stream.push(null)
  return stream
}

module.exports = {bufferToStream}
