/* eslint unicorn/no-process-exit: off */
const prepare = require('./prepare')
const {applyChanges} = require('./communes-nouvelles')
const {extractEPCI} = require('./epci')
const {extractPopulation, computeMLPPopulation} = require('./population')
const {getCodesPostaux, computeMLPCodesPostaux} = require('./codes-postaux')
const {MLP_CODES} = require('./mlp')
const {extractCommunesCOM} = require('./collectivites-outremer')
const {extractDepartements, extractRegions, extractArrondissements} = require('./cog')
const {writeData, extractDataFromSource, getSourceFilePath} = require('./util')

async function buildRegions() {
  const regions = await extractRegions(getSourceFilePath('regions.csv'))
  await writeData('regions', regions)
}

async function buildDepartements() {
  const departements = await extractDepartements(getSourceFilePath('departements.csv'))
  await writeData('departements', departements)
}

async function buildArrondissements() {
  const arrondissements = await extractArrondissements(getSourceFilePath('arrondissements.csv'))
  await writeData('departements', arrondissements)
}

async function buildCommunes({population}) {
  const rows = await extractDataFromSource('France2018-txt.zip')
  const data = rows
    .map(prepare.prepareCommune)
    .filter(Boolean)

  data.forEach(commune => {
    if (['commune-actuelle', 'arrondissement-municipal'].includes(commune.type)) {
      const codesPostaux = getCodesPostaux(commune.code)
      if (codesPostaux.length > 0) {
        commune.codesPostaux = codesPostaux
      } else if (shouldWarnCodePostal(commune.code)) {
        console.log(`Commune du COG sans code postal : ${commune.code}`)
      }

      if (commune.code in population) {
        commune.population = population[commune.code].populationMunicipale
      } else if (shouldWarnPopulation(commune.code)) {
        console.log(`Commune du COG sans population : ${commune.code}`)
      }
    }
  })

  await applyChanges(data)
  await computeMLPPopulation(data)
  await computeMLPCodesPostaux(data)

  const communesCOM = await extractCommunesCOM(getSourceFilePath('collectivites-outremer.csv'))
  communesCOM.forEach(commune => data.push(commune))

  await writeData('communes', data)
}

async function buildEPCI() {
  const rows = await extractEPCI(getSourceFilePath('epcicom2019.xlsx'))
  await writeData('epci', rows)
}

async function main() {
  const population = await extractPopulation(getSourceFilePath('population2019.xls.gz'))

  await buildRegions()
  await buildDepartements()
  await buildArrondissements()
  await buildCommunes({population: population.communes})
  await buildEPCI()
}

function shouldWarnPopulation(codeCommune) {
  if (codeCommune.startsWith('976')) {
    return false // Mayotte
  }

  if (MLP_CODES.includes(codeCommune)) {
    return false // Paris, Marseille, Lyon
  }

  return true
}

function shouldWarnCodePostal(codeCommune) {
  if (MLP_CODES.includes(codeCommune)) {
    return false // Paris, Marseille, Lyon
  }

  return true
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
