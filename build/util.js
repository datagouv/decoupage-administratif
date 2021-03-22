const {join} = require('path')
const {promisify} = require('util')
const zlib = require('zlib')
const {createReadStream} = require('fs')
const getStream = require('get-stream').array
const parse = require('csv-parser')
const pumpify = require('pumpify').obj
const {outputFile} = require('fs-extra')
const {readFile} = require('fs-extra')
const xlsx = require('node-xlsx').default

const gunzip = promisify(zlib.gunzip)

function getSourceFilePath(fileName) {
  return join(__dirname, '..', 'sources', fileName)
}

async function readSheets(filePath) {
  const rawFileContent = await readFile(filePath)
  const fileContent = filePath.endsWith('.gz') ? await gunzip(rawFileContent) : rawFileContent
  return xlsx.parse(fileContent, {cellDates: true})
}

function readCsvFile(filePath, options = {}) {
  return getStream(pumpify(
    createReadStream(filePath),
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

module.exports = {writeData, getSourceFilePath, readSheets, readCsvFile}
