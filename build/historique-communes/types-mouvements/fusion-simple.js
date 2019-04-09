const {chain} = require('lodash')
const {mouvementToKey, mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .groupBy('com_ap')
    .forEach(mouvementsComposition => {
      const communesMembres = chain(mouvementsComposition)
        .uniqBy(m => mouvementToKey(m, 'av')) // FIX doublons fichier INSEE
        .map(m => {
          const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'av'))
          return model.createSuccessor(communeOrigine, {type: 'COMP'}, 'fusion simple', true)
        })
        .value()

      const communeGroupe = model.initCommune({
        ...mouvementToCommune(mouvementsComposition[0], 'ap'),
        type: 'COM'
      })

      model.start(communeGroupe, 'fusion simple')
      communeGroupe.membres = communesMembres
      communesMembres.forEach(c => {
        c.pole = communeGroupe
      })
    })
    .value()
}
