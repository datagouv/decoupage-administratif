#!/usr/bin/env node
const {join} = require('path')
const {remove} = require('fs-extra')
const {extractEPCI} = require('./epci')
const {extractEPT} = require('./ept')
const {extractSirenInsee} = require('./correspondances-insee-siren-communes')
const {extractPopulation, computeMLPPopulation} = require('./population')
const {getCodesPostaux, computeMLPCodesPostaux} = require('./codes-postaux')
const {MLP_CODES} = require('./mlp')
const {extractCommunesCOM, generateDepartementsAndRegionsCOM} = require('./collectivites-outremer')
const {extractDepartements, extractRegions, extractArrondissements, extractCommunes} = require('./cog')
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

async function buildCommunes(regions, departements, arrondissements, population) {
  const inseeSirenMatching = await extractSirenInsee(getSourceFilePath('banatic_siren_insee.xlsx'))
  const data = await extractCommunes(
    getSourceFilePath('communes.csv'),
    getSourceFilePath('mouvements-communes.csv'),
    arrondissements,
    departements,
    regions
  )

  data.forEach(commune => {
    if (['commune-actuelle', 'arrondissement-municipal'].includes(commune.type)) {
      if (commune.code in inseeSirenMatching) {
        commune.siren = String(inseeSirenMatching[commune.code].siren)
      }

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
  return data
}

async function buildEPCI() {
  const rows = await extractEPCI(getSourceFilePath('epcicom.xlsx'))
  await writeData('epci', rows)
}

async function buildEPT(communes, population) {
  const rows = await extractEPT(getSourceFilePath('ept.xlsx'))
  const inseeCommunesWithEpt = rows.reduce((acc, row) => {
    acc = [...acc, ...row.membres]
    return acc
  }, [])
  const communesWithEpt = communes
    .filter(commune => inseeCommunesWithEpt.includes(commune.code))
    .reduce((acc, curr) => {
      acc[curr.code] = curr
      return acc
    }, {})
  rows.forEach(row => {
    row.membres = row.membres.map(membre => {
      return {
        code: communesWithEpt[membre].code,
        siren: communesWithEpt[membre].siren,
        nom: communesWithEpt[membre].nom,
        populationTotale: population[membre].populationTotale,
        populationMunicipale: population[membre].populationMunicipale
      }
    })
    row.populationTotale = row.membres.map(membre => membre.populationTotale).reduce((a, b) => a + b, 0)
    row.populationMunicipale = row.membres.map(membre => membre.populationMunicipale).reduce((a, b) => a + b, 0)
  })
  await writeData('ept', rows)
}

async function main() {
  await remove(join(__dirname, '..', 'data'))

  const populationHorsMayotte = await extractPopulation(getSourceFilePath('donnees_communes.csv'))
  const populationMayotte = await extractPopulation(getSourceFilePath('donnees_communes_mayotte.csv'))
  const population = {
    communes: {...populationHorsMayotte.communes, ...populationMayotte.communes}
  }
  const arrondissements = await extractArrondissements(getSourceFilePath('arrondissements.csv'))
  const departementsMetroAndDrom = await extractDepartements(getSourceFilePath('departements.csv'))
  const [departementsCom, regionsCom] = await generateDepartementsAndRegionsCOM(getSourceFilePath('collectivites-outremer.csv'))
  const departements = [...departementsMetroAndDrom, ...departementsCom]
  const regionsMetroAndDrom = await extractRegions(getSourceFilePath('regions.csv'))
  const regions = [...regionsMetroAndDrom, ...regionsCom]
  await buildRegions(regions)
  await buildDepartements(departements)
  await buildArrondissements(arrondissements)
  const communes = await buildCommunes(regions, departements, arrondissements, population.communes)
  await buildEPCI()
  await buildEPT(communes, population.communes)
}

function shouldWarnPopulation(codeCommune) {
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
