const {readCsvFile} = require('./util')

const chefLieuCOM = {
  '975': '97502',
  '977': '97701',
  '978': '97801',
  '984': '97502',
  '986': '98613',
  '987': '98735',
  '988': '98818',
  '989': '98901'
}

async function extractCommunesCOM(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    const commune = {
      code: row.code_commune,
      nom: row.nom_commune,
      departement: row.code_collectivite,
      region: row.code_collectivite,
      zone: 'com',
      type: 'commune-actuelle'
    }

    if (row.code_postal) {
      if (row.code_postal.includes('|')) {
        commune.codesPostaux = row.code_postal.split('|')
      } else {
        commune.codesPostaux = [row.code_postal]
      }
    }

    if (row.population) {
      commune.population = Number.parseInt(row.population, 10)
    }

    return commune
  })
}

async function generateDepartementsAndRegionsCOM(path) {
  const rows = await readCsvFile(path)

  const departements = Object.values(rows.reduce((acc, curr) => {
    if (!(curr.code_collectivite in acc)) {
        acc[curr.code_collectivite] = {
        code: curr.code_collectivite,
        region: curr.code_collectivite,
        chefLieu: chefLieuCOM[curr.code_collectivite],
        nom: curr.nom_collectivite,
        typeLiaison: 0,
        zone: 'com'
      }
    }
    return acc
  }, {}))

  const regions = JSON.parse(JSON.stringify(departements)).map(el => {
    delete el.region
    return el
  });
  return [departements, regions]
}

module.exports = {extractCommunesCOM, generateDepartementsAndRegionsCOM}
