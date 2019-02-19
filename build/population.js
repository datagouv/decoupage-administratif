const {promisify} = require('util')
const fs = require('fs')
const zlib = require('zlib')
const {keyBy, zipObject} = require('lodash')
const xlsx = require('node-xlsx').default
const {MLP_CODES} = require('./mlp')

const readFile = promisify(fs.readFile)
const gunzip = promisify(zlib.gunzip)

async function loadSheets(path) {
  const fileContent = await readFile(path)
  return xlsx.parse(await gunzip(fileContent))
}

function extractCommunes(sheets) {
  const sheet = sheets.find(s => s.name === 'Communes')
  const columns = sheet.data[7]
  const rows = sheet.data.slice(8)
  return rows
    .map(row => {
      const obj = zipObject(columns, row)
      if (!obj['Code département'] || !obj['Code commune']) {
        return null
      }

      return {
        codeCommune: obj['Code département'].substr(0, 2) + obj['Code commune'],
        populationMunicipale: obj['Population municipale']
      }
    })
    .filter(Boolean)
}

async function extractPopulation(path) {
  const sheets = await loadSheets(path)
  return {
    communes: keyBy(extractCommunes(sheets), 'codeCommune')
  }
}

async function computeMLPPopulation(communes) {
  MLP_CODES.forEach(code => {
    const commune = communes.find(c => c.code === code)
    commune.population = communes
      .filter(c => c.commune === code)
      .reduce((population, arrondissement) => population + arrondissement.population, 0)
  })
}

module.exports = {extractPopulation, computeMLPPopulation}
