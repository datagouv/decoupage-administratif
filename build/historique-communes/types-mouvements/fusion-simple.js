const {chain} = require('lodash')
const {mouvementToKey, mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .groupBy('COM_AP')
    .forEach(mouvementsComposition => {
      const communesMembres = chain(mouvementsComposition)
        .uniqBy(m => mouvementToKey(m, 'AV')) // FIX doublons fichier INSEE
        .map(m => {
          const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
          return model.createSuccessor(communeOrigine, {type: 'COMP'}, 'fusion simple', true)
        })
        .value()

      const communeGroupe = model.initCommune({
        ...mouvementToCommune(mouvementsComposition[0], 'AP'),
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
