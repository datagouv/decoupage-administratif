const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .filter(m => m.typecom_av === 'COM')
    .groupBy(m => m.com_av)
    .forEach(mouvementsComposition => {
      const communesRetablies = mouvementsComposition
        .filter(m => m.typecom_ap === 'COM')
        .map(m => ({...mouvementToCommune(m, 'ap'), pole: undefined}))

      const communeGroupe = model.getCommune({
        type: 'COM',
        code: mouvementsComposition[0].com_av
      }, true)

      const groupeMaintenu = communeGroupe && communeGroupe.membres && communeGroupe.membres.some(communeMembre => {
        return !communesRetablies.some(communeRetablie => communeRetablie.code === communeMembre.code)
      })

      const mvtCommuneGroupe =
          mouvementsComposition.find(m => m.typecom_av === m.typecom_ap && m.com_av === m.com_ap)

      if (!(communeGroupe && communeGroupe.membres) && !groupeMaintenu) {
        // Création (on fait le choix de ne pas implicitement créer d'ensembles complexes dans le passé à ce stade)

        // On renomme néanmoins la commune mère le cas échéant
        if (communeGroupe && mvtCommuneGroupe && mvtCommuneGroupe.libelle_ap !== communeGroupe.nom) {
          model.createSuccessor(
            communeGroupe,
            {
              nom: mvtCommuneGroupe.libelle_ap,
              typeLiaison: Number.parseInt(mvtCommuneGroupe.tncc_ap, 10),
              membres: undefined
            },
            'renommage suite à création d’une commune fille',
            true)
        }

        mouvementsComposition.filter(m => m.com_av !== m.com_ap).forEach(m => {
          const commune = model.initCommune(mouvementToCommune(m, 'ap'))
          model.start(commune, 'création')
        })
      } else if ((communeGroupe && communeGroupe.membres) && groupeMaintenu) {
        // Rétablissement de certaines communes constituant la commune groupe
        const nouvelleCommuneGroupe = model.createSuccessor(
          communeGroupe,
          mvtCommuneGroupe ? {nom: mvtCommuneGroupe.libelle_ap, typeLiaison: Number.parseInt(mvtCommuneGroupe.tncc_ap, 10)} : {},
          'recomposition de la commune groupe',
          true
        )
        nouvelleCommuneGroupe.membres = []
        communeGroupe.membres.forEach(communeMembre => {
          const communeRetablie = communesRetablies.find(
            // On exclut la commune chef-lieu qui ne peut être rétablie partiellement
            c => c.code === communeMembre.code && c.code !== communeGroupe.code
          )
          if (communeRetablie) {
            model.createSuccessor(communeMembre, communeRetablie, 'rétablissement')
          } else {
            const nouvelleCommune = model.createSuccessor(communeMembre, {}, 'recomposition de la commune parent', true)
            nouvelleCommune.pole = nouvelleCommuneGroupe
            nouvelleCommuneGroupe.membres.push(nouvelleCommune)
          }
        })
      } else if ((communeGroupe && communeGroupe.membres) && !groupeMaintenu) {
        // Dé-fusion complète d'une commune groupe et retour à ses composantes pré-existantes
        model.end(communeGroupe, 'dé-fusion')
        mouvementsComposition.forEach(m => {
          const ancienneCommune = model.getInactiveCommuneOrInit({
            code: m.com_ap,
            nom: m.libelle_ap,
            typeLiaison: m.tncc_ap
          })
          if (!ancienneCommune.pole) {
            // Cas où la commune vient d'être créée (périmée au 1er janvier 1943)
            ancienneCommune.pole = communeGroupe
            communeGroupe.membres.push(ancienneCommune)
          }

          model.createSuccessor(
            ancienneCommune,
            {type: 'COM', nom: m.libelle_ap, typeLiaison: Number.parseInt(m.tncc_ap, 10), pole: undefined},
            'dé-fusion'
          )
        })
      } else {
        throw new Error('Cas normalement impossible. Investigation nécessaire !!')
      }
    }).value()
}
