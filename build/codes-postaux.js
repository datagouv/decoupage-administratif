const {groupBy, chain, uniq} = require('lodash')
const codesPostaux = require('./../sources/codes-postaux-with-fix.json')
const {MLP_CODES} = require('./mlp')

const codesPostauxIndex = groupBy(codesPostaux, 'codeCommune')

function getCodesPostaux(codeCommune) {
  if (codeCommune in codesPostauxIndex) {
    return uniq(codesPostauxIndex[codeCommune].map(i => i.codePostal))
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
