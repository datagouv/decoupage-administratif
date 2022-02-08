const {readCsvFile} = require('./util')

async function extractCommunesCOM(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    const commune = {
      code: row.code_commune,
      nom: row.nom_commune,
      collectiviteOutremer: {
        code: row.code_collectivite,
        nom: row.nom_collectivite
      },
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

module.exports = {extractCommunesCOM}
