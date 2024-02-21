const {keyBy} = require('lodash')
const {MLP_CODES} = require('./mlp')
const {readCsvFile} = require('./util')

async function extractPopulation(path) {
  const rows = await readCsvFile(path, {separator: ';'})
  const refactoredRows = rows.map(commune => ({
    codeCommune: `${commune.DEP.length === 3 ? commune.DEP.slice(0, 2) : commune.DEP}${commune.CODCOM}`,
    populationMunicipale: Number(commune.PMUN.replace(' ', '')),
    populationTotale: Number(commune.PTOT.replace(' ', ''))
  }))
  return {
    communes: keyBy(refactoredRows, 'codeCommune')
  }
}

async function computeMLPPopulation(communes) {
  MLP_CODES.forEach(code => {
    const commune = communes.find(c => c.code === code)
    commune.population = communes
      .filter(c => c.commune === code)
      .reduce((population, arrondissement) => population + arrondissement.population, 0)
  })
}

module.exports = {extractPopulation, computeMLPPopulation}
