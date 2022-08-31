const {zipObject, keyBy} = require('lodash')
const {readSheets} = require('./util')

async function extractSirenInsee(path) {
  const [sheet] = await readSheets(path)
  const [columns, ...rows] = sheet.data
  const items = rows.map(row => zipObject(columns, row))
  return keyBy(items, 'insee')
}

module.exports = {extractSirenInsee}
