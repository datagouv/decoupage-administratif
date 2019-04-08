const {join} = require('path')
const {promisify} = require('util')
const zlib = require('zlib')
const {createReadStream} = require('fs')
const {createGunzip} = require('gunzip-stream')
const getStream = require('get-stream').array
const parse = require('csv-parser')
const decompress = require('decompress')
const {decodeStream} = require('iconv-lite')
const pumpify = require('pumpify').obj
const {outputFile} = require('fs-extra')
const intoStream = require('into-stream')
const {readFile} = require('fs-extra')
const xlsx = require('node-xlsx').default

const gunzip = promisify(zlib.gunzip)

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

async function readSheets(filePath) {
  const rawFileContent = await readFile(filePath)
  const fileContent = filePath.endsWith('.gz') ? await gunzip(rawFileContent) : rawFileContent
  return xlsx.parse(fileContent, {cellDates: true})
}

function readCsvFile(filePath, options = {}) {
  return getStream(pumpify(
    createReadStream(filePath),
    createGunzip(),
    parse({separator: ',', strict: true, ...options})
  ))
}

async function writeJsonArray(path, data) {
  const jsonData = '[\n' + data.map(JSON.stringify).join(',\n') + '\n]\n'
  await outputFile(path, jsonData)
}

async function writeData(name, data) {
  await writeJsonArray(join(__dirname, '..', 'data', `${name}.json`), data)
}

module.exports = {writeData, extractDataFromSource, getSourceFilePath, readSheets, readCsvFile}
