const {join} = require('path')
const getStream = require('get-stream').array
const parse = require('csv-parser')
const decompress = require('decompress')
const {decodeStream} = require('iconv-lite')
const pumpify = require('pumpify').obj
const writeJsonFile = require('write-json-file')
const intoStream = require('into-stream')

async function extractDataFromFile(path) {
  const [file] = await decompress(path)
  const stream = pumpify(
    intoStream(file.data),
    decodeStream('win1252'),
    parse({separator: '\t', strict: true})
  )
  return getStream(stream)
}

function extractDataFromSource(fileName) {
  return extractDataFromFile(join(__dirname, '..', 'sources', fileName))
}

async function writeData(name, data) {
  await writeJsonFile(join(__dirname, '..', 'data', `${name}.json`), data, {indent: null})
}

module.exports = {writeData, extractDataFromSource}
