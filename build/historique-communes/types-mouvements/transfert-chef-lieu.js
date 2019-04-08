module.exports = function (mouvements, model) {
  mouvements
    .filter(m => m.typecom_av === 'COM' && m.typecom_ap === 'COM' && m.libelle_av === m.libelle_ap)
    .forEach(m => {
      const communeGroupe = model.getCommune({type: 'COM', code: m.com_av})
      const nouvelleCommuneGroupe = model.createSuccessor(
        communeGroupe,
        {code: m.com_ap, membres: []},
        'changement de chef lieu',
        true
      )
      nouvelleCommuneGroupe.membres = communeGroupe.membres.map(communeMembre => {
        const communeAssociee = mouvements.some(
          m => m.typecom_ap === 'COMA' && m.com_ap === communeMembre.code && m.libelle_ap === communeMembre.nom
        )
        const communeDeleguee = mouvements.some(
          m => m.typecom_ap === 'COMD' && m.com_ap === communeMembre.code && m.libelle_ap === communeMembre.nom
        )
        const nouveauType = (communeAssociee && 'COMA') || (communeDeleguee && 'COMD') || 'COMP'
        return model.createSuccessor(
          communeMembre,
          {type: nouveauType, pole: nouvelleCommuneGroupe},
          'changement de chef lieu de la commune groupe',
          true
        )
      })
    })
}
