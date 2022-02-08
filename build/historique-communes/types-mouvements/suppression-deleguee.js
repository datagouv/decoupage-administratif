const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    const communeDeleguee = model.getCommuneOrInit({...mouvementToCommune(m, 'AV'), type: 'COMD'})
    model.createSuccessor(communeDeleguee, {type: 'COMP'}, 'suppression de la commune déléguée', true)
  })
}
