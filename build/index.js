/* eslint unicorn/no-process-exit: off */
const prepare = require('./prepare')
const {applyChanges} = require('./communes-nouvelles')
const {extractEPCI} = require('./epci')
const {extractPopulation} = require('./population')
const {writeData, extractDataFromSource, getSourceFilePath} = require('./util')

async function buildRegions() {
  const rows = await extractDataFromSource('reg2018-txt.zip')
  const regions = rows.map(prepare.prepareRegion).filter(Boolean)
  await writeData('regions', regions)
}

async function buildDepartements() {
  const rows = await extractDataFromSource('depts2018-txt.zip')
  const data = rows.map(prepare.prepareDepartement).filter(Boolean)
  await writeData('departements', data)
}

async function buildArrondissements() {
  const rows = await extractDataFromSource('arrond2018-txt.zip')
  const data = rows.map(prepare.prepareArrondissement).filter(Boolean)
  await writeData('arrondissements', data)
}

async function buildCommunes({population}) {
  const rows = await extractDataFromSource('France2018-txt.zip')
  const data = rows
    .map(prepare.prepareCommune)
    .filter(Boolean)

  data.forEach(commune => {
    if (commune.type === 'commune-actuelle') {
      if (commune.code in population) {
        commune.population = population[commune.code].populationMunicipale
      } else if (shouldWarnPopulation(commune.code)) {
        console.log(`Commune du COG sans population : ${commune.code}`)
      }
    }
  })

  await applyChanges(data)
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

  if (['75056', '13055', '69123'].includes(codeCommune)) {
    return false // Paris, Marseille, Lyon
  }

  return true
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
