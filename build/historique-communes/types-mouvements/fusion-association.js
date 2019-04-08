const {chain} = require('lodash')
const {isFusionAssociation, mouvementToKey, mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  const communesAssociees = mouvements.filter(m => m.typecom_ap === 'COMA').map(m => m.com_ap)

  chain(mouvements)
    .filter(m => m.typecom_ap !== 'COMA')
    .groupBy('com_ap')
    .forEach(mouvementsComposition => {
      const communesMembres = chain(mouvementsComposition)
        .uniqBy(m => mouvementToKey(m, 'av')) // FIX doublons fichier INSEE
        .map(m => {
          const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'av'))
          if (isFusionAssociation(communeOrigine)) {
            const membres = communeOrigine.membres
              .filter(communeMembre => !(communesAssociees.includes(communeMembre.code)))
              .map(communeMembre => {
                return model.createSuccessor(
                  communeMembre,
                  {type: 'COMP'},
                  'commune-parente membre d’une fusion-association'
                )
              })

            const successeur = model.createSuccessor(
              communeOrigine,
              {type: communesAssociees.includes(communeOrigine.code) ? 'COMA' : 'COMP', membres},
              'fusion-association'
            )

            membres.forEach(m => {
              m.pole = successeur
            })

            return successeur
          }

          return model.createSuccessor(
            communeOrigine,
            {type: communesAssociees.includes(communeOrigine.code) ? 'COMA' : 'COMP'},
            'fusion-association',
            true
          )
        })
        .value()

      const communeGroupe = model.initCommune({
        ...mouvementToCommune(mouvementsComposition[0], 'ap'),
        type: 'COM'
      })

      model.start(communeGroupe, 'fusion-association')
      communeGroupe.membres = communesMembres
      communesMembres.forEach(c => {
        c.pole = communeGroupe
      })
    })
    .value()
}
