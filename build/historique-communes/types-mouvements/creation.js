const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    // On ignore les lignes qui indiquent que les communes cédant des parcelles sont maintenues
    if (m.com_av === m.com_ap) {
      return
    }

    const commune = model.getCommuneOrInit(mouvementToCommune(m, 'ap'))
    model.start(commune, 'création')
  })
}
