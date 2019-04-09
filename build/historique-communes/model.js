const {pick} = require('lodash')
const {getKey, DEFAULT_START_DATE} = require('./helpers')

class Model {
  constructor() {
    this.records = []
    this.indexedRecords = {}
    this.today = undefined
    this.assignedIds = new Set()
  }

  hello(newDate) {
    this.today = newDate
  }

  _getActiveRecord(key) {
    const current = this.indexedRecords[key]

    if (current && !current.dateFin) {
      return current
    }
  }

  _registerRecord(obj, relax = false) {
    const k = getKey(obj)
    const activeRecord = this._getActiveRecord(k)

    if (!relax && activeRecord && activeRecord.type !== 'COMP') {
      console.log('nouveau', obj)
      console.log('actuel', activeRecord)
      throw new Error(`Un objet actif existe déjà pour cette clé : ${k}`)
    }

    this.indexedRecords[k] = obj
    this.records.push(obj)
  }

  initCommune(record, relax = false) {
    const newRecord = pick(record, 'nom', 'type', 'code', 'membres', 'pole', 'typeLiaison')
    this._registerRecord(newRecord, relax)
    return newRecord
  }

  getCommuneOrInit(obj, relax = false) {
    const k = getKey(obj)
    const activeRecord = this._getActiveRecord(k)

    if (activeRecord) {
      return activeRecord
    }

    return this.initCommune(obj, relax)
  }

  getCommune(obj, relax = false) {
    const k = getKey(obj)
    const activeRecord = this._getActiveRecord(k)

    if (!activeRecord && !relax) {
      console.log('Date en cours', this.today)
      console.log('Enregistrement courant', this.indexedRecords[k])
      throw new Error(`Aucune entrée active trouvée pour ${k}`)
    }

    return activeRecord
  }

  getInactiveCommuneOrInit({code, nom, typeLiaison}) {
    const communeDeleguee = this.getCommune({type: 'COMD', code}, true)
    if (communeDeleguee) {
      return communeDeleguee
    }

    const communeAssociee = this.getCommune({type: 'COMA', code}, true)
    if (communeAssociee) {
      return communeAssociee
    }

    const communePerimee = this.getCommune({type: 'COMP', code}, true)
    if (communePerimee) {
      return communePerimee
    }

    return this.initCommune({code, nom, typeLiaison, type: 'COMP'})
  }

  assignId(record) {
    let id = `${getKey(record)}@${record.dateDebut || DEFAULT_START_DATE}`

    if (this.assignedIds.has(id)) {
      if (record.type !== 'COMP') {
        throw new Error('ID déjà assigné : ' + id)
      }

      id += '@2'

      if (this.assignedIds.has(id)) {
        throw new Error('ID déjà assigné : ' + id)
      }
    }

    this.assignedIds.add(id)
    record.id = id
  }

  connectOne(from, to, reason) {
    this.end(from, reason)
    this.start(to, reason)
    from.successeur = to
    to.predecesseur = from
  }

  end(record, reason) {
    if (record.dateFin && record.dateFin !== this.today) {
      throw new Error('Record is already ended')
    }

    record.raisonFin = reason
    record.dateFin = this.today
  }

  start(record, reason) {
    if (record.dateDebut && record.dateDebut !== this.today) {
      throw new Error('Record is already started')
    }

    record.raisonDebut = reason
    record.dateDebut = this.today
  }

  getCurrentOf(record) {
    if (!record.successeur) {
      return record
    }

    return this.getCurrentOf(record.successeur)
  }

  createSuccessor(record, changes, reason, relax = false) {
    const currentRecord = this.getCurrentOf(record)
    const newRecord = {...currentRecord, ...changes}
    relax = relax || (currentRecord.type === newRecord.type && currentRecord.code === newRecord.code)
    const successor = this.initCommune(newRecord, relax)
    this.connectOne(currentRecord, successor, reason)
    return successor
  }
}

module.exports = {Model}
