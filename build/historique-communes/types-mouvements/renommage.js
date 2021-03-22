const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    // On ignore les lignes faisant intervenir d'autres types de communes (doute sur la pertinence de ces lignes)
    if (m.TYPECOM_AV !== 'COM' || m.TYPECOM_AP !== 'COM') {
      return
    }

    const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
    model.createSuccessor(
      communeOrigine,
      {nom: m.LIBELLE_AP, typeLiaison: Number.parseInt(m.TNCC_AP, 10)},
      'changement de nom',
      true
    )
  })
}
