const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    const communeOrigine = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
    model.createSuccessor(communeOrigine, {code: m.COM_AP}, 'changement de département')
  })
}
