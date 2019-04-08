const {createReadStream} = require('fs')
const parse = require('csv-parser')
const pumpify = require('pumpify').obj
const getStream = require('get-stream').array

async function extractCommunesCOM(path) {
  const rows = await getStream(pumpify(
    createReadStream(path),
    parse({separator: ',', strict: true})
  ))

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
      commune.codesPostaux = [row.code_postal]
    }

    if (row.population) {
      commune.population = Number.parseInt(row.population, 10)
    }

    return commune
  })
}

module.exports = {extractCommunesCOM}
