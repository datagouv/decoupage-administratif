const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  const communesMaintenues = mouvements
    .filter(m => m.TYPECOM_AP !== 'COM')
    .map(m => mouvementToCommune(m, 'AP'))

  const motif = communesMaintenues.length > 0 ? 'fusion partielle' : 'fusion totale'

  chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COM')
    .groupBy('COM_AV')
    .forEach(mouvementsComposition => {
      const communeGroupe = model.getCommune({
        type: 'COM',
        code: mouvementsComposition[0].COM_AV
      })
      const ligneChangementNom = mouvementsComposition.find(m => m.TYPECOM_AP === 'COM' && m.COM_AV === m.COM_AP)
      const nouvelleCommuneGroupe = model.createSuccessor(
        communeGroupe,
        ligneChangementNom ? {nom: ligneChangementNom.LIBELLE_AP, typeLiaison: Number.parseInt(ligneChangementNom.TNCC_AP, 10)} : {},
        motif,
        true
      )
      nouvelleCommuneGroupe.membres = []
      communeGroupe.membres.forEach(communeMembre => {
        const communeMaintenue = communesMaintenues.find(c => c.code === communeMembre.code)
        if (communeMaintenue) {
          const nouvelleCommune = model.createSuccessor(
            communeMembre,
            {...communeMaintenue, pole: nouvelleCommuneGroupe},
            'recomposition de la commune parente (fusion partielle)',
            true
          )
          nouvelleCommuneGroupe.membres.push(nouvelleCommune)
        } else {
          const nouvelleCommune = model.createSuccessor(
            communeMembre,
            {type: 'COMP', pole: nouvelleCommuneGroupe},
            'fusion avec la commune parente',
            true
          )
          nouvelleCommuneGroupe.membres.push(nouvelleCommune)
        }
      })
    })
    .value()
}
