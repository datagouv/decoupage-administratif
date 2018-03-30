/* eslint unicorn/no-process-exit: off */
const {join} = require('path')
const getStream = require('get-stream').array
const parse = require('csv-parser')
const decompress = require('decompress')
const {decodeStream} = require('iconv-lite')
const pumpify = require('pumpify').obj
const writeJsonFile = require('write-json-file')

const prepare = require('./prepare')
const {bufferToStream} = require('./buffer-stream')

async function extractDataFromFile(path) {
  const [file] = await decompress(path)
  const stream = pumpify(
    bufferToStream(file.data),
    decodeStream('win1252'),
    parse({separator: '\t', strict: true})
  )
  return getStream(stream)
}

function extractDataFromSource(fileName) {
  return extractDataFromFile(join(__dirname, '..', 'sources', fileName))
}

const DATASETS = [
  {name: 'regions', source: 'reg2018-txt.zip', model: prepare.prepareRegion},
  {name: 'departements', source: 'depts2018-txt.zip', model: prepare.prepareDepartement},
  {name: 'arrondissements', source: 'arrond2018-txt.zip', model: prepare.prepareArrondissement},
  {name: 'communes', source: 'France2018-txt.zip', model: prepare.prepareCommune}
]

async function main() {
  await Promise.all(DATASETS.map(async ({source, model, name}) => {
    const rawData = await extractDataFromSource(source)
    const data = rawData.map(model).filter(Boolean)
    await writeJsonFile(join(__dirname, '..', 'data', `${name}.json`), data, {indent: null})
  }))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
