const {join} = require('path')
const getStream = require('get-stream').array
const parse = require('csv-parser')
const decompress = require('decompress')
const {decodeStream} = require('iconv-lite')
const pumpify = require('pumpify').obj
const {outputFile} = require('fs-extra')
const intoStream = require('into-stream')

function getSourceFilePath(fileName) {
  return join(__dirname, '..', 'sources', fileName)
}

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
  return extractDataFromFile(getSourceFilePath(fileName))
}

async function writeJsonArray(path, data) {
  const jsonData = '[\n' + data.map(JSON.stringify).join(',\n') + '\n]\n'
  await outputFile(path, jsonData)
}

async function writeData(name, data) {
  await writeJsonArray(join(__dirname, '..', 'data', `${name}.json`), data)
}

module.exports = {writeData, extractDataFromSource, getSourceFilePath}
