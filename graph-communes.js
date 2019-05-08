const {keyBy, clone} = require('lodash')
const historiqueCommunes = require('./data/historique-communes.json')

function convertToGraph(historiqueCommunes) {
  const historiqueCommunesClone = historiqueCommunes.map(clone)
  const byId = keyBy(historiqueCommunesClone, 'id')

  historiqueCommunesClone.forEach(h => {
    if (h.successeur) {
      h.successeur = byId[h.successeur]
    }

    if (h.predecesseur) {
      h.predecesseur = byId[h.predecesseur]
    }

    if (h.pole) {
      h.pole = byId[h.pole]
    }

    if (h.membres) {
      h.membres = h.membres.map(m => byId[m])
    }
  })

  return historiqueCommunesClone
}

module.exports = convertToGraph(historiqueCommunes)
