const {groupBy, chain} = require('lodash')
const codesPostaux = require('./../sources/codes-postaux.json')
const {MLP_CODES} = require('./mlp')

const codesPostauxIndex = groupBy(codesPostaux, 'codeCommune')

function getCodesPostaux(codeCommune) {
  if (codeCommune in codesPostauxIndex) {
    return codesPostauxIndex[codeCommune].map(i => i.codePostal)
  }

  // Cas spécifique de la commune de Suzan (non présente dans le fichier des codes postaux)
  // Source Wikidata (https://www.wikidata.org/wiki/Q1363310)
  if (codeCommune === '09304') {
    return ['09240']
  }

  return []
}

async function computeMLPCodesPostaux(communes) {
  MLP_CODES.forEach(code => {
    const commune = communes.find(c => c.code === code)
    commune.codesPostaux = chain(communes)
      .filter(c => c.commune === code)
      .map('codesPostaux')
      .flatten()
      .uniq()
      .value()
  })
}

module.exports = {getCodesPostaux, computeMLPCodesPostaux}
