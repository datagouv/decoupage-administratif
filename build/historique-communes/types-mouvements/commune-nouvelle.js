const {chain} = require('lodash')
const {mouvementToKey, mouvementToCommune, isCommuneNouvelle, isFusionAssociation, getKey} = require('../helpers')

module.exports = function (mouvements, model) {
  const communesRestantDeleguees = chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COMD' && m.TYPECOM_AP === 'COMD')
    .map(m => [mouvementToKey(m, 'AV'), mouvementToCommune(m, 'AP')])
    .fromPairs()
    .value()
  const communesRestantAssociees = chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COMA' && m.TYPECOM_AP === 'COMA')
    .map(m => [mouvementToKey(m, 'AV'), mouvementToCommune(m, 'AP')])
    .fromPairs()
    .value()
  const communesAssocieesDevenantDeleguees = chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COMA' && m.TYPECOM_AP === 'COMD')
    .map(m => [mouvementToKey(m, 'AV'), mouvementToCommune(m, 'AP')])
    .fromPairs()
    .value()
  const communesDevenantDeleguees = chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COM' && m.TYPECOM_AP === 'COMD')
    .map(m => [mouvementToKey(m, 'AV'), mouvementToCommune(m, 'AP')])
    .fromPairs()
    .value()

  chain(mouvements)
    .filter(m => m.TYPECOM_AP !== 'COMA' && m.TYPECOM_AP !== 'COMD')
    .groupBy('COM_AP')
    .forEach(mouvementsComposition => {
      const communeNouvelleMembres = chain(mouvementsComposition)
        // FIX doublons fichier INSEE quand une commune vient de changer de département
        .filter(m => m.COM_AV.substr(0, 2) === m.COM_AP.substr(0, 2))
        .map(m => {
          const communeSource = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
          const communeSourceKey = mouvementToKey(m, 'AV')
          return {communeSource, communeSourceKey}
        })
        .map(({communeSource, communeSourceKey}) => {
          if (isCommuneNouvelle(communeSource) && !(communeSourceKey in communesDevenantDeleguees)) {
            const raison = 'dissolution ou élargissement de la commune nouvelle'
            const successeur = model.createSuccessor(
              communeSource,
              {
                type: 'COMP',
                membres: communeSource.membres
                  .filter(communeMembre => !(getKey(communeMembre) in communesRestantDeleguees))
                  .map(communeMembre => model.createSuccessor(communeMembre, {type: 'COMP'}, raison))
              },
              raison
            )
            successeur.membres.forEach(c => {
              c.pole = successeur
            })
            return successeur
          }

          if (isCommuneNouvelle(communeSource)) {
            const successeur = model.createSuccessor(
              communeSource,
              {
                ...communesDevenantDeleguees[communeSourceKey],
                membres: communeSource.membres
                  .filter(communeMembre => !(getKey(communeMembre) in communesRestantDeleguees))
                  .map(communeMembre => {
                    const key = getKey(communeMembre)
                    return model.createSuccessor(
                      communeMembre,
                      {type: communesRestantAssociees[key] ? 'COMA' : 'COMP'},
                      'commune parente restant ou devenant commune déléguée'
                    )
                  })
              },
              'commune restant ou devenant commune déléguée'
            )
            successeur.membres.forEach(c => {
              c.pole = successeur
            })
            return successeur
          }

          if (isFusionAssociation(communeSource) && !(communeSourceKey in communesDevenantDeleguees)) {
            const raison = 'dissolution de la fusion-association dans une commune nouvelle'
            const successeur = model.createSuccessor(
              communeSource,
              {
                type: 'COMP',
                membres: communeSource.membres
                  .filter(communeMembre => !(getKey(communeMembre) in communesAssocieesDevenantDeleguees))
                  .map(communeMembre => model.createSuccessor(communeMembre, {type: 'COMP'}, raison))
              },
              raison
            )
            successeur.membres.forEach(c => {
              c.pole = successeur
            })
            return successeur
          }

          if (isFusionAssociation(communeSource)) {
            const raison = 'commune devenant commune déléguée'
            const successeur = model.createSuccessor(
              communeSource,
              {
                ...communesDevenantDeleguees[communeSourceKey],
                membres: communeSource.membres
                  .filter(communeMembre => !(getKey(communeMembre) in communesAssocieesDevenantDeleguees))
                  .map(communeMembre => {
                    const key = getKey(communeMembre)
                    return model.createSuccessor(
                      communeMembre,
                      {type: communesRestantAssociees[key] ? 'COMA' : 'COMP'},
                      'commune parente devenant commune déléguée'
                    )
                  })
              },
              raison
            )
            successeur.membres.forEach(c => {
              c.pole = successeur
            })
            return successeur
          }

          if (communeSourceKey in communesDevenantDeleguees) {
            return model.createSuccessor(communeSource, {
              ...communesDevenantDeleguees[communeSourceKey]
            }, 'commune devenant déléguée')
          }

          if (communeSourceKey in communesAssocieesDevenantDeleguees) {
            return model.createSuccessor(communeSource, {
              ...communesAssocieesDevenantDeleguees[communeSourceKey]
            }, 'commune associée devenant déléguée')
          }

          if (communeSourceKey in communesRestantDeleguees) {
            return model.createSuccessor(communeSource, {
              ...communesAssocieesDevenantDeleguees[communeSourceKey]
            }, 'commune restant déléguée')
          }

          if (!communeSource.pole && !(communeSourceKey in communesRestantAssociees)) {
            return model.createSuccessor(communeSource, {
              type: 'COMP'
            }, 'commune absorbée par la commune nouvelle')
          }

          return null
        })
        .filter(Boolean)
        .value()

      const communeNouvelle = model.initCommune({
        ...mouvementToCommune(mouvementsComposition[0], 'AP'),
        membres: communeNouvelleMembres
      }, true)
      model.start(communeNouvelle, 'commune nouvelle')

      communeNouvelleMembres.forEach(membre => {
        membre.pole = communeNouvelle
      })
    })
    .value()
}
