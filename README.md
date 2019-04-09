# @etalab/decoupage-administratif

Données concernant le découpage administratif français, au format JSON.

- Communes
- Historique des communes depuis 1943
- Arrondissements
- Départements
- Régions
- EPCI (à fiscalité propre)

## Installation

```bash
# npm
npm install @etalab/decoupage-administratif

# yarn
yarn add @etalab/decoupage-administratif
```

## Utilisation

```js
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const departements = require('@etalab/decoupage-administratif/data/departements.json')
const regions = require('@etalab/decoupage-administratif/data/regions.json')
const arrondissements = require('@etalab/decoupage-administratif/data/arrondissements.json')
const historiqueCommunes = require('@etalab/decoupage-administratif/data/historique-communes.json')
```

## Sources

* [Code Officiel Géographique](https://insee.fr/fr/information/2560452) de l'INSEE
* [Liste des EPCI à fiscalité propre](https://www.collectivites-locales.gouv.fr/liste-et-composition-des-epci-a-fiscalite-propre) de la DGCL
* [Population légale](https://www.insee.fr/fr/statistiques/3677855) de l'INSEE
* [Liste des codes postaux](https://www.data.gouv.fr/fr/datasets/codes-postaux/) d'Etalab, [produite à partie de données DGFIP](https://github.com/etalab/codes-postaux)

## Licence

Données : [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence)\
Code : MIT
