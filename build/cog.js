const {keyBy} = require('lodash')
const {readCsvFile} = require('./util')

function parseTypeLiaison(TNCC) {
  return Number.parseInt(TNCC, 10)
}

async function extractDepartements(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    return {
      code: row.DEP,
      region: row.REG,
      chefLieu: row.CHEFLIEU,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC)
    }
  })
}

async function extractRegions(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    return {
      code: row.REG,
      chefLieu: row.CHEFLIEU,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC)
    }
  })
}

async function extractArrondissements(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    return {
      code: row.ARR,
      departement: row.DEP,
      region: row.REG,
      chefLieu: row.CHEFLIEU,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC)
    }
  })
}

function getRangChefLieu(codeCommune, chefsLieuxArrondissement, chefsLieuxDepartement, chefsLieuxRegion) {
  if (chefsLieuxRegion.includes(codeCommune)) {
    return 4
  }

  if (chefsLieuxDepartement.includes(codeCommune)) {
    return 3
  }

  if (chefsLieuxArrondissement.includes(codeCommune)) {
    return 2
  }

  return 0
}

async function extractCommunes(path, arrondissements, departements, regions, historiqueCommunes) {
  const rows = await readCsvFile(path)
  const chefsLieuxRegion = regions.map(e => e.chefLieu)
  const chefsLieuxDepartement = departements.map(r => r.chefLieu)
  const chefsLieuxArrondissement = arrondissements.map(r => r.chefLieu)

  const communes = rows.map(row => {
    const commune = {
      code: row.COM,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC)
    }

    if (row.TYPECOM === 'COM') {
      commune.arrondissement = row.ARR
      commune.departement = row.DEP
      commune.region = row.REG
      commune.type = 'commune-actuelle'
      commune.rangChefLieu = getRangChefLieu(row.com, chefsLieuxArrondissement, chefsLieuxDepartement, chefsLieuxRegion)
    }

    if (row.TYPECOM === 'COMA') {
      commune.type = 'commune-associee'
      commune.chefLieu = row.COMPARENT
    }

    if (row.TYPECOM === 'COMD') {
      commune.type = 'commune-deleguee'
      commune.chefLieu = row.COMPARENT
    }

    if (row.TYPECOM === 'ARM') {
      commune.type = 'arrondissement-municipal'
      commune.commune = row.COMPARENT
    }

    return commune
  })

  const communesActuelles = keyBy(communes.filter(c => c.type === 'commune-actuelle'), 'code')

  communes.forEach(commune => {
    if (commune.type !== 'commune-actuelle' && (commune.chefLieu || commune.commune)) {
      const communeParente = communesActuelles[commune.chefLieu || commune.commune]
      commune.arrondissement = communeParente.arrondissement
      commune.departement = communeParente.departement
      commune.region = communeParente.region
    }
  })

  if (historiqueCommunes) {
    expandWithAnciensCodes(communes, historiqueCommunes)
  }

  return communes
}

function expandWithAnciensCodes(communes, historiqueCommunes) {
  const historiqueCommunesActuelles = historiqueCommunes
    .filter(h => ['COMA', 'COMD', 'COM'].includes(h.type) && !h.dateFin)

  const historiqueCommunesActuellesIndex = keyBy(historiqueCommunesActuelles, h => `${h.type}-${h.code}`)

  communes.forEach(commune => {
    if (commune.type === 'arrondissement-municipal') {
      return
    }

    const key = `${getPrefix(commune)}-${commune.code}`
    const entreeHistorique = historiqueCommunesActuellesIndex[key]
    const codes = getAllCodes(entreeHistorique)
    codes.delete(commune.code)
    if (codes.size > 0) {
      commune.anciensCodes = [...codes]
    }
  })
}

function getPrefix(commune) {
  if (commune.type === 'commune-actuelle') {
    return 'COM'
  }

  if (commune.type === 'commune-deleguee') {
    return 'COMD'
  }

  if (commune.type === 'commune-associee') {
    return 'COMA'
  }
}

function getAllCodes(historiqueRecord, acc = new Set()) {
  acc.add(historiqueRecord.code)

  if (!historiqueRecord.predecesseur) {
    return acc
  }

  return getAllCodes(historiqueRecord.predecesseur, acc)
}

module.exports = {extractDepartements, extractRegions, extractArrondissements, extractCommunes}
