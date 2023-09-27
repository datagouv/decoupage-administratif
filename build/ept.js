const {zipObject, chain} = require('lodash')
const {readSheets} = require('./util')

function formatSiren(siren) {
  return String(siren).padStart(9, '0')
}

function formatCodeCommune(codeCommune) {
  return String(codeCommune).padStart(5, '0')
}

async function extractEPT(path) {
  const sheets = await readSheets(path)
  const sheet = sheets.find(sheet => sheet.name === 'Composition_communale')
  const [columns, ...rows] = sheet.data.slice(5).filter(line => line.length > 0)
  const items = rows.map(row => zipObject(columns, row))
  return chain(items)
    .groupBy('EPT')
    .map(items => {
      const [first] = items
      return {
        code: formatSiren(first.EPT),
        nom: first.LIBEPT,
        type: 'EPT',
        modeFinancement: '',
        membres: items.map(item => formatCodeCommune(item.CODGEO))
      }
    })
    .value()
}

module.exports = {extractEPT}
