const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .filter(m => m.TYPECOM_AV === 'COMD')
    .uniqBy('COM_AV')
    .forEach(m => {
      const commune = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
      model.end(commune, 'suppression de la commune déléguée')
    })
    .value()
}
