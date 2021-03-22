#!/usr/bin/env node
const {join} = require('path')
const {remove} = require('fs-extra')
const {extractEPCI} = require('./epci')
const {extractPopulation, computeMLPPopulation} = require('./population')
const {getCodesPostaux, computeMLPCodesPostaux} = require('./codes-postaux')
const {MLP_CODES} = require('./mlp')
const {extractCommunesCOM} = require('./collectivites-outremer')
const {extractDepartements, extractRegions, extractArrondissements, extractCommunes} = require('./cog')
const {extractHistoriqueCommunes, flattenRecord} = require('./historique-communes')
const {writeData, getSourceFilePath} = require('./util')

async function buildRegions(regions) {
  await writeData('regions', regions)
}

async function buildDepartements(departements) {
  await writeData('departements', departements)
}

async function buildArrondissements(arrondissements) {
  await writeData('arrondissements', arrondissements)
}

async function buildCommunes(regions, departements, arrondissements, population, historiqueCommunes) {
  const data = await extractCommunes(getSourceFilePath('communes.csv'), arrondissements, departements, regions, historiqueCommunes)

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

  await computeMLPPopulation(data)
  await computeMLPCodesPostaux(data)

  const communesCOM = await extractCommunesCOM(getSourceFilePath('collectivites-outremer.csv'))
  communesCOM.forEach(commune => data.push(commune))

  await writeData('communes', data)
}

async function buildEPCI() {
  const rows = await extractEPCI(getSourceFilePath('epcicom2020.xlsx'))
  await writeData('epci', rows)
}

async function buildHistoriqueCommunes(historiqueCommunes) {
  const rows = historiqueCommunes.map(flattenRecord)
  await writeData('historique-communes', rows)
}

async function main() {
  await remove(join(__dirname, '..', 'data'))

  const population = await extractPopulation(getSourceFilePath('population2019.xls.gz'))
  const historiqueCommunes = await extractHistoriqueCommunes(
    getSourceFilePath('communes.csv'),
    getSourceFilePath('mouvements-communes.csv')
  )
  const arrondissements = await extractArrondissements(getSourceFilePath('arrondissements.csv'))
  const departements = await extractDepartements(getSourceFilePath('departements.csv'))
  const regions = await extractRegions(getSourceFilePath('regions.csv'))

  await buildRegions(regions)
  await buildDepartements(departements)
  await buildArrondissements(arrondissements)
  await buildCommunes(regions, departements, arrondissements, population.communes, historiqueCommunes)
  await buildHistoriqueCommunes(historiqueCommunes)
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
