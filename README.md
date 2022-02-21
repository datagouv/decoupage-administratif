# @etalab/decoupage-administratif

Données concernant le découpage administratif français, au format JSON.

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

## Millésimes et versions de package

Vous avez besoin de données:

- 2022, prendre la version 2.0.0 `npm install @etalab/decoupage-administratif@2.0.0`
- 2021, prendre la version 1.1.1 `npm install @etalab/decoupage-administratif@1.1.1`
- 2020, non disponible, sauf les EPCI 2020 via la version 0.8
- 2019, prendre la version 0.7 `npm install @etalab/decoupage-administratif@0.8`


## Sources

* [Code Officiel Géographique](https://insee.fr/fr/information/2560452) de l'INSEE
* [Liste des EPCI à fiscalité propre](https://www.collectivites-locales.gouv.fr/institutions/liste-et-composition-des-epci-fiscalite-propre) de la DGCL ([url exacte](https://www.collectivites-locales.gouv.fr/files/Accueil/DESL/2022/epcicom2022.xlsx))
* [Population légale](https://www.insee.fr/fr/statistiques/6011070?sommaire=6011075) de l'INSEE + [population Mayotte INSEE 2017](https://www.insee.fr/fr/statistiques/3291775?sommaire=2120838)
* [Liste des codes postaux](https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/) issue des données La Poste. Antérieurement, sous licence ODBL, maintenant en LO

## Licence

Données : [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence)\
Code : MIT
