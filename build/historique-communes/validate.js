const {isActiveAt, getKey} = require('./helpers')

function validate(records) {
  records
    .filter(r => !r._deleted)
    .forEach(commune => {
      const key = getKey(commune)

      if (commune.pole && !isActiveAt(commune.pole, commune.dateDebut)) {
        console.log('Commune dont la commune parente n’est pas active : ' + key)
      }

      if (commune.membres && commune.membres.some(c => !isActiveAt(c, commune.dateDebut))) {
        console.log('Commune groupe avec membres inactifs : ' + key)
      }

      if (commune.type !== 'COM' && !commune.pole) {
        console.log('Commune non actuelle sans commune parent : ' + key)
      }

      if (commune.type === 'COMD' && commune.membres && commune.membres.some(c => c.type !== 'COMP' && c.type !== 'COMA')) {
        console.log('Commune groupe déléguée contenant des communes actuelles ou déléguées : ' + key)
      }

      if (commune.type === 'COMA' && commune.membres && commune.membres.some(c => c.type !== 'COMP')) {
        console.log('Commune groupe associée contenant des communes non périmées : ' + key)
      }

      if (commune.type === 'COMP' && commune.membres && commune.membres.some(c => c.type !== 'COMP')) {
        console.log('Commune groupe périmée contenant des communes non périmées : ' + key)
      }
    })
}

module.exports = {validate}
