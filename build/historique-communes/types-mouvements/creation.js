const {mouvementToCommune} = require('../helpers')

module.exports = function (mouvements, model) {
  mouvements.forEach(m => {
    // On ignore les lignes qui indiquent que les communes cédant des parcelles sont maintenues
    if (m.COM_AV === m.COM_AP) {
      return
    }

    const commune = model.getCommuneOrInit(mouvementToCommune(m, 'AP'))
    model.start(commune, 'création')
  })
}
