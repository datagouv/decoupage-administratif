const DEFAULT_START_DATE = '1943-01-01'

function getKey(record) {
  return `${record.type}-${record.code}`
}

function mouvementToCommune(m, select) {
  if (!select || !['av', 'ap'].includes(select)) {
    throw new Error('select est requis et doit être "av" ou "ap"')
  }

  return {
    type: m['typecom_' + select],
    code: m['com_' + select],
    nom: m['libelle_' + select],
    typeLiaison: Number.parseInt(m['tncc_' + select], 10)
  }
}

function mouvementToKey(m, select) {
  if (!select || !['av', 'ap'].includes(select)) {
    throw new Error('select est requis et doit être "av" ou "ap"')
  }

  return m['typecom_' + select] + '-' + m['com_' + select]
}

function isActiveAt(commune, date = DEFAULT_START_DATE) {
  if (commune.dateDebut && commune.dateDebut > date) {
    return false
  }

  if (commune.dateFin && commune.dateFin <= date) {
    return false
  }

  return true
}

function isCommuneNouvelle(commune) {
  return commune.membres && commune.membres.some(c => c.type === 'COMD')
}

function isFusionAssociation(commune) {
  return commune.membres && commune.membres.some(c => c.type === 'COMA')
}

function flattenRecord(record) {
  const flattened = {...record}

  if (flattened.predecesseur) {
    flattened.predecesseur = flattened.predecesseur.id
  }

  if (flattened.successeur) {
    flattened.successeur = flattened.successeur.id
  }

  if (flattened.pole) {
    flattened.pole = flattened.pole.id
  }

  if (flattened.membres) {
    flattened.membres = flattened.membres.map(m => m.id)
  }

  return flattened
}

module.exports = {
  flattenRecord,
  isFusionAssociation,
  isCommuneNouvelle,
  isActiveAt,
  mouvementToCommune,
  mouvementToKey,
  getKey,
  DEFAULT_START_DATE
}
