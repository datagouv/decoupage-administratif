const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    // On ignore les lignes faisant intervenir d'autres types de communes (doute sur la pertinence de ces lignes)
    if (m.typecom_av !== 'COM' || m.typecom_ap !== 'COM') {
      return
    }

    const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'av'))
    model.createSuccessor(
      communeOrigine,
      {nom: m.libelle_ap, typeLiaison: Number.parseInt(m.tncc_ap, 10)},
      'changement de nom',
      true
    )
  })
}
