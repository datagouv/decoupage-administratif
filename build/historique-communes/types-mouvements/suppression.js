const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .filter(m => m.COM_AV !== m.COM_AP)
    .uniqBy('COM_AV')
    .forEach(m => {
      const commune = model.getCommuneOrInit(mouvementToCommune(m, 'AV'))
      model.end(commune, 'suppression')
    })
    .value()
}
