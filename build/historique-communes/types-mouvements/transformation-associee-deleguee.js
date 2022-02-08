const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    const communeAssociee = model.getCommuneOrInit({...mouvementToCommune(m, 'AV'), type: 'COMA'})
    model.createSuccessor(communeAssociee, {type: 'COMD'}, 'changement de statut', true)
  })
}
