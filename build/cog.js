const {readCsvFile} = require('./util')

function parseTypeLiaison(TNCC) {
  return Number.parseInt(TNCC, 10)
}

async function extractDepartements(path) {
  const rows = await readCsvFile(path)

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
  const rows = await readCsvFile(path)

  return rows.map(row => {
    return {
      code: row.reg,
      chefLieu: row.cheflieu,
      nom: row.libelle,
      typeLiaison: parseTypeLiaison(row.tncc)
    }
  })
}

async function extractArrondissements(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    return {
      code: row.arr,
      departement: row.dep,
      region: row.reg,
      chefLieu: row.cheflieu,
      nom: row.libelle,
      typeLiaison: parseTypeLiaison(row.tncc)
    }
  })
}

module.exports = {extractDepartements, extractRegions, extractArrondissements}
