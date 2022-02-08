module.exports = function (mouvements, model) {
  mouvements
    .filter(m => m.TYPECOM_AV === 'COM' && m.TYPECOM_AP === 'COM' && m.LIBELLE_AV === m.LIBELLE_AP)
    .forEach(m => {
      const communeGroupe = model.getCommune({type: 'COM', code: m.COM_AV})
      const nouvelleCommuneGroupe = model.createSuccessor(
        communeGroupe,
        {code: m.COM_AP, membres: []},
        'changement de chef lieu',
        true
      )
      nouvelleCommuneGroupe.membres = communeGroupe.membres.map(communeMembre => {
        const communeAssociee = mouvements.some(
          m => m.TYPECOM_AP === 'COMA' && m.COM_AP === communeMembre.code && m.LIBELLE_AP === communeMembre.nom
        )
        const communeDeleguee = mouvements.some(
          m => m.TYPECOM_AP === 'COMD' && m.COM_AP === communeMembre.code && m.LIBELLE_AP === communeMembre.nom
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
