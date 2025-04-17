const {zipObject, chain} = require('lodash')
const {readSheets} = require('./util')

function formatSiren(siren) {
  return String(siren).padStart(9, '0')
}

function formatCodeCommune(codeCommune) {
  return String(codeCommune).padStart(5, '0')
}

async function extractEPCI(path) {
  const [sheet] = await readSheets(path)
  const [columns, ...rows] = sheet.data
  const items = rows.map(row => zipObject(columns, row))
  const colNames = Object.keys(items[0])
  const ptotColName = colNames.filter(key => key.startsWith('ptot_'))[0]
  const pmunColName = colNames.filter(key => key.startsWith('pmun_'))[0]
  return chain(items)
    .groupBy('siren')
    .map(items => {
      const [first] = items
      return {
        code: formatSiren(first.siren),
        nom: first.raison_sociale,
        type: first.nature_juridique,
        modeFinancement: first.mode_financ,
        populationTotale: first.total_pop_tot,
        populationMunicipale: first.total_pop_mun,
        membres: items.map(item => ({
          code: formatCodeCommune(item.insee),
          siren: formatSiren(item.siren_membre),
          nom: item.nom_membre,
          populationTotale: item[ptotColName],
          populationMunicipale: item[pmunColName]
        }))
      }
    })
    .value()
    .filter(item => item.code !== 'undefined')
}

module.exports = {extractEPCI}
