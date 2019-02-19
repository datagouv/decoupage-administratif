# @etalab/decoupage-administratif
API JavaScript permettant d'interroger le découpage administratif français

- Communes
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
```

## Sources

* [Code Officiel Géographique](https://www.data.gouv.fr/fr/datasets/code-officiel-geographique-cog/) de l'INSEE
* [Table de passage des communes nouvelles](https://www.insee.fr/fr/information/2549968) de l'INSEE
* [Liste des EPCI à fiscalité propre](https://www.collectivites-locales.gouv.fr/liste-et-composition-des-epci-a-fiscalite-propre) de la DGCL
* [Population légale](https://www.insee.fr/fr/statistiques/3677855) de l'INSEE
* [Liste des codes postaux](https://www.data.gouv.fr/fr/datasets/codes-postaux/) d'Etalab, [produite à partie de données DGFIP](https://github.com/etalab/codes-postaux)

## Licence

Données : LO\
Code : MIT
