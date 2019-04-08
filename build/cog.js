const {createReadStream} = require('fs')
const parse = require('csv-parser')
const pumpify = require('pumpify').obj
const getStream = require('get-stream').array

function parseTypeLiaison(TNCC) {
  return Number.parseInt(TNCC, 10)
}

async function extractDepartements(path) {
  const rows = await getStream(pumpify(
    createReadStream(path),
    parse({separator: ',', strict: true})
  ))

  return rows.map(row => {
    return {
      code: row.dep,
      region: row.reg,
      chefLieu: row.cheflieu,
      nom: row.libelle,
      typeLiaison: parseTypeLiaison(row.tncc)
    }
  })
}

async function extractRegions(path) {
  const rows = await getStream(pumpify(
    createReadStream(path),
    parse({separator: ',', strict: true})
  ))

  return rows.map(row => {
    return {
      code: row.reg,
      chefLieu: row.cheflieu,
      nom: row.libelle,
      typeLiaison: parseTypeLiaison(row.tncc)
    }
  })
}

module.exports = {extractDepartements, extractRegions}
