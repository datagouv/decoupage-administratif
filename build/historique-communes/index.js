const {chain, groupBy, pick, keyBy} = require('lodash')
const {readCsvFile} = require('../util')
const {Model} = require('./model')
const {validate} = require('./validate')
const {getKey, flattenRecord} = require('./helpers')

async function extractHistoriqueCommunes(communesPath, mouvementsPath) {
  const mouvements = await readCsvFile(mouvementsPath)
  mouvements.reverse()

  const model = new Model()

  chain(mouvements)
    // On ignore les arrondissements municipaux
    .filter(m => m.TYPECOM_AV !== 'ARM' && m.TYPECOM_AP !== 'ARM')
    .groupBy('DATE_EFF')
    .forEach((mouvements, dateEffet) => {
      model.hello(dateEffet)
      const mouvementsParCode = groupBy(mouvements, 'MOD')

      // Changement de nom
      if (mouvementsParCode['10']) {
        require('./types-mouvements/renommage')(mouvementsParCode['10'], model)
      }

      // Création
      if (mouvementsParCode['20']) {
        require('./types-mouvements/creation')(mouvementsParCode['20'], model)
      }

      // Suppression
      if (mouvementsParCode['30']) {
        require('./types-mouvements/suppression')(mouvementsParCode['30'], model)
      }

      // Changement de département
      if (mouvementsParCode['41']) {
        require('./types-mouvements/changement-departement')(mouvementsParCode['41'], model)
      }

      // Transformation de commune associée en commune déléguée
      // Aucune ligne du fichier n'utilise cette valeur pour le moment
      if (mouvementsParCode['70']) {
        require('./types-mouvements/transformation-associee-deleguee')(mouvementsParCode['70'], model)
      }

      // Rétablissement (total ou partiel)
      if (mouvementsParCode['21']) {
        require('./types-mouvements/retablissement')(mouvementsParCode['21'], model)
      }

      // Changement de code dû à un transfert de chef-lieu
      if (mouvementsParCode['50']) {
        require('./types-mouvements/transfert-chef-lieu')(mouvementsParCode['50'], model)
      }

      // Fusion simple
      if (mouvementsParCode['31']) {
        require('./types-mouvements/fusion-simple')(mouvementsParCode['31'], model)
      }

      // Commune nouvelle
      if (mouvementsParCode['32']) {
        require('./types-mouvements/commune-nouvelle')(mouvementsParCode['32'], model)
      }

      // Fusion-association
      if (mouvementsParCode['33']) {
        require('./types-mouvements/fusion-association')(mouvementsParCode['33'], model)
      }

      // Transformation de fusion association en fusion simple
      if (mouvementsParCode['34']) {
        require('./types-mouvements/transformation-associee-fusionnee')(mouvementsParCode['34'], model)
      }

      // Suppression de la commune déléguée
      if (mouvementsParCode['35']) {
        require('./types-mouvements/suppression-deleguee')(mouvementsParCode['35'], model)
      }
    }).value()

  const rawCommunes = await readCsvFile(communesPath)
  const communesActuelles = rawCommunes.map(r => ({
    code: r.COM,
    type: r.TYPECOM,
    nom: r.LIBELLE,
    typeLiaison: Number.parseInt(r.TNCC, 10),
    codeCommuneParente: r.COMPARENT
  }))
  const index = keyBy(communesActuelles, c => getKey(c))

  // On vérifie que toutes les entrées actives du modèle sont bien dans la liste
  model.records.forEach(r => {
    if (r.dateFin || r.type === 'COMP') {
      return
    }

    const key = getKey(r)
    const communeActuelle = index[key]

    if (!communeActuelle) {
      console.log('Commune calculée à partir des mouvements non présente dans le COG en vigueur : ' + key)
      console.log(r)
    } else if (communeActuelle.nom !== r.nom) {
      console.log('Erreur de correspondance de nom pour la commune : ' + key)
      console.log('COG : ' + communeActuelle.nom)
      console.log('Mouvements : ' + r.nom)
    }
  })

  // On vérifie que toutes les communes actuelles soit n'existe pas (et on les créé) soit sont bien actives
  communesActuelles.forEach(communeActuelle => {
    if (communeActuelle.type === 'ARM') {
      return
    }

    const key = getKey(communeActuelle)
    const communeModel = model.indexedRecords[key]

    if (communeActuelle.codeCommuneParente && !communeModel) {
      console.log('Commune actuelle ayant une commune parente et non présente dans les communes calculées : ' + key)
    }

    if (communeActuelle.codeCommuneParente && communeModel) {
      if (!communeModel.pole || communeModel.pole.code !== communeActuelle.codeCommuneParente) {
        console.log('Les communes parents ne correspondent pas')
      }
    }

    if (communeModel && communeModel.dateFin) {
      console.log('Commune du COG en vigueur présente dans les communes calculées mais inactive ')
    }

    if (!communeModel) {
      model.initCommune(pick(communeActuelle, 'code', 'type', 'nom', 'typeLiaison'))
    }
  })

  // Suppression des étapes intermédiaires (communes éphémères)
  model.records
    .filter(r => r.dateDebut && r.dateFin && r.dateDebut === r.dateFin)
    .forEach(r => {
      const {predecesseur, successeur} = r
      const raison = r.raisonDebut + ' + ' + r.raisonFin
      predecesseur.successeur = successeur
      predecesseur.raisonFin = raison
      successeur.predecesseur = predecesseur
      successeur.raisonDebut = raison
      r._deleted = true
    })

  model.records.forEach(r => {
    if (r._deleted) {
      return
    }

    model.assignId(r)
  })

  validate(model.records)

  return model.records.filter(r => !r._deleted)
}

module.exports = {extractHistoriqueCommunes, flattenRecord}
