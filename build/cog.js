const {keyBy, invertBy} = require('lodash')
const {readCsvFile} = require('./util')

function parseTypeLiaison(TNCC) {
  return Number.parseInt(TNCC, 10)
}

async function extractDepartements(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    let zone
    if (row.ZONE) {
      zone = row.ZONE
    } else if (row.DEP.length > 2) {
      zone = 'dom'
    } else {
      zone = 'metro'
    }

    return {
      code: row.DEP,
      region: row.REG,
      chefLieu: row.CHEFLIEU,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC),
      zone
    }
  })
}

async function extractRegions(path) {
  const rows = await readCsvFile(path)

  return rows.map(row => {
    let zone
    if (row.ZONE) {
      zone = row.ZONE
    } else if (['01', '02', '03', '04', '06'].includes(row.REG)) {
      zone = 'dom'
    } else {
      zone = 'metro'
    }

    return {
      code: row.REG,
      chefLieu: row.CHEFLIEU,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC),
      zone
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

function computeAnciensCodesCommunes(communesRows, mouvementsRows) {
  const reversedMouvementsRows = [...mouvementsRows].reverse()

  const communesActuelles = new Set(
    communesRows
      .filter(c => c.TYPECOM === 'COM' || c.TYPECOM === 'ARM')
      .map(c => c.COM)
  )

  const successorMapping = {}

  reversedMouvementsRows
    .filter(m => m.TYPECOM_AV === 'COM' && m.TYPECOM_AP === 'COM' && m.COM_AV !== m.COM_AP)
    .forEach(m => {
      if (communesActuelles.has(m.COM_AV)) {
        return
      }

      successorMapping[m.COM_AV] = m.COM_AP
    })

  function getSuccessor(codeCommune) {
    if (communesActuelles.has(codeCommune)) {
      return codeCommune
    }

    const successor = successorMapping[codeCommune]

    if (!successor) {
      throw new Error('Successeur inconnu pour le code ' + codeCommune)
    }

    return getSuccessor(successor)
  }

  for (const codeCommune of Object.keys(successorMapping)) {
    successorMapping[codeCommune] = getSuccessor(codeCommune)
  }

  return invertBy(successorMapping)
}

/* eslint-disable max-params */
async function extractCommunes(communesPath, mouvementsCommunesPath, arrondissements, departements, regions) {
  const communesRows = await readCsvFile(communesPath)
  const chefsLieuxRegion = regions.map(e => e.chefLieu)
  const chefsLieuxDepartement = departements.map(r => r.chefLieu)
  const chefsLieuxArrondissement = arrondissements.map(r => r.chefLieu)

  const mouvementsRows = await readCsvFile(mouvementsCommunesPath)
  const anciensCodesIndex = computeAnciensCodesCommunes(communesRows, mouvementsRows)

  const communes = communesRows.map(row => {
    let zone
    if (row.zone) {
      zone = row.zone
    } else if (row.DEP.length > 2) {
      zone = 'dom'
    } else {
      zone = 'metro'
    }

    const commune = {
      code: row.COM,
      nom: row.LIBELLE,
      typeLiaison: parseTypeLiaison(row.TNCC),
      zone
    }

    if (row.TYPECOM === 'COM') {
      commune.arrondissement = row.ARR
      commune.departement = row.DEP
      commune.region = row.REG
      commune.type = 'commune-actuelle'
      commune.rangChefLieu = getRangChefLieu(row.com, chefsLieuxArrondissement, chefsLieuxDepartement, chefsLieuxRegion)
      commune.anciensCodes = anciensCodesIndex[row.COM]
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

  return communes
}
/* eslint-enable max-params */

module.exports = {extractDepartements, extractRegions, extractArrondissements, extractCommunes}
