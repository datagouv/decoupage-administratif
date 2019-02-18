const {promisify} = require('util')
const fs = require('fs')
const {zipObject, chain} = require('lodash')
const xlsx = require('node-xlsx').default

const readFile = promisify(fs.readFile)

function formatSiren(siren) {
  return String(siren).padStart(9, '0')
}

function formatCodeCommune(codeCommune) {
  return String(codeCommune).padStart(5, '0')
}

async function extractEPCI(path) {
  const fileContent = await readFile(path)
  const [sheet] = xlsx.parse(fileContent)
  const [columns, ...rows] = sheet.data
  const items = rows.map(row => zipObject(columns, row))
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
          populationTotale: item.ptot_2018,
          populationMunicipale: item.pmun_2018
        }))
      }
    })
    .value()
}

module.exports = {extractEPCI}
