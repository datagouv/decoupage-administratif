const {chain} = require('lodash')
const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  chain(mouvements)
    .filter(m => m.com_av !== m.com_ap)
    .uniqBy('com_av')
    .forEach(m => {
      const commune = model.getCommuneOrInit(mouvementToCommune(m, 'av'))
      model.end(commune, 'suppression')
    })
    .value()
}
