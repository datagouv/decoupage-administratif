const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'av'))
    model.createSuccessor(communeOrigine, {code: m.com_ap}, 'changement de département')
  })
}
