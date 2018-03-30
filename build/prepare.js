function prepareRegion({REGION, CHEFLIEU, TNCC, NCCENR}) {
  return {
    code: REGION,
    chefLieu: CHEFLIEU,
    nom: NCCENR,
    typeLiaison: parseTypeLiaison(TNCC)
  }
}

function prepareDepartement({REGION, DEP, CHEFLIEU, TNCC, NCCENR}) {
  return {
    code: DEP,
    region: REGION,
    chefLieu: CHEFLIEU,
    nom: NCCENR,
    typeLiaison: parseTypeLiaison(TNCC)
  }
}

function prepareArrondissement({REGION, DEP, AR, CHEFLIEU, TNCC, NCCENR}) {
  return {
    code: DEP + AR,
    departement: DEP,
    region: REGION,
    chefLieu: CHEFLIEU,
    nom: NCCENR,
    typeLiaison: parseTypeLiaison(TNCC)
  }
}

function computeNom(ARTMIN, NCCENR) {
  ARTMIN = ARTMIN.replace(/\(|\)/g, '')
  if (!ARTMIN) {
    return NCCENR
  }
  return (ARTMIN.endsWith('\'') ? ARTMIN : ARTMIN + ' ') + NCCENR
}

function prepareCommune({REG, DEP, COM, AR, TNCC, ARTMIN, NCCENR, POLE, ACTUAL, CHEFLIEU}) {
  if (ACTUAL === '9') {
    return
  }

  const commune = {
    code: DEP + COM,
    departement: DEP,
    region: REG,
    nom: computeNom(ARTMIN, NCCENR),
    typeLiaison: parseTypeLiaison(TNCC)
  }

  switch (ACTUAL) {
    // Commune actuelle
    case '1':
      commune.type = 'commune-actuelle'
      commune.arrondissement = DEP + AR
      commune.rangChefLieu = Number.parseInt(CHEFLIEU, 10)
      break
    // Commune associée
    case '2':
      commune.chefLieu = POLE
      commune.type = 'commune-associee'
      break
    // Commune périmée
    case '3':
      commune.type = 'commune-perimee'
      if (POLE) {
        commune.communeAbsorbante = POLE
      }
      break
    // Ancien code dû à un changement de département
    case '4':
      commune.nouveauCode = POLE
      commune.type = 'ancien-code'
      break
    // Arrondissement municipal
    case '5':
      commune.commune = POLE
      commune.type = 'arrondissement-municipal'
      break
    // Commune déléguée
    case '6':
      commune.chefLieu = POLE
      commune.type = 'commune-deleguee'
      break

    default:
      break
  }

  return commune
}

function parseTypeLiaison(TNCC) {
  return Number.parseInt(TNCC, 10)
}

module.exports = {
  prepareRegion,
  prepareDepartement,
  prepareArrondissement,
  prepareCommune
}
