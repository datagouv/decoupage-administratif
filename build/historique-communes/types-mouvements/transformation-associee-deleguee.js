const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    const mvt_av = mouvementToCommune(m, 'AV')
    const mvt_ap = mouvementToCommune(m, 'AP')
    if (mvt_av.type == 'COMA' && mvt_av.code == mvt_ap.code) {
      const communeAssociee = model.getCommuneOrInit({ ...mvt_av, type: 'COMA' })
      model.createSuccessor(communeAssociee, { type: 'COMD' }, 'changement de statut', true)
    } else {
      const communeAssociee = model.getCommuneOrInit({ ...mvt_ap, type: 'COMA' })
      // model.records.filter(el => el.type == mvt_av.type && el.code == mvt_ap.code)[0].successeur
      // const communeAssociees = model.records.filter(el => el.type == mvt_av.type && el.code == mvt_ap.code)
      // for (let communeAssociee of communeAssociees) {
      //   console.log(communeAssociee)
      //   model.createSuccessor(communeAssociee, { type: 'COMD' }, 'changement de statut', true)
      // }
      //model.records.filter(el => el.type == 'COMA' && el.code == '52454').slice(-1)[0].pole
      //model.records.filter(el => el.type == 'COMA' && el.code == '08068').slice(-1)[0].pole == m.COM_AV
      //model.records.filter(el => el.type == 'COMA' && el.code == '08068').slice(-1)[0].pole.code == m.COM_AV
      //model.records.filter(el => el.type == 'COMA' && el.code == '08068').slice(-1)[0].pole.membres
      // Compréhension: les COMA enfants deviennent communes déléguées de la nouvelle commune
      // const communeAssociee = model.getCommuneOrInit({ ...mvt_av, type: 'COMA' })
      model.createSuccessor(communeAssociee, { type: 'COMD' }, 'changement de statut', true)
    }
  })
}
