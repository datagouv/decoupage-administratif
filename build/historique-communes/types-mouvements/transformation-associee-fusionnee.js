const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  const communesMaintenues = mouvements
    .filter(m => m.typecom_ap !== 'COM')
    .map(m => mouvementToCommune(m, 'ap'))

  const motif = communesMaintenues.length > 0 ? 'fusion partielle' : 'fusion totale'

  chain(mouvements)
    .filter(m => m.typecom_av === 'COM')
    .groupBy('com_av')
    .forEach(mouvementsComposition => {
      const communeGroupe = model.getCommune({
        type: 'COM',
        code: mouvementsComposition[0].com_av
      })
      const ligneChangementNom = mouvementsComposition.find(m => m.typecom_ap === 'COM' && m.com_av === m.com_ap)
      const nouvelleCommuneGroupe = model.createSuccessor(
        communeGroupe,
        ligneChangementNom ? {nom: ligneChangementNom.libelle_ap, typeLiaison: Number.parseInt(ligneChangementNom.tncc_ap, 10)} : {},
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
