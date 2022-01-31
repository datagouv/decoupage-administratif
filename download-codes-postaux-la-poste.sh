#!/usr/bin/env bash
curl "https://datanova.legroupe.laposte.fr/explore/dataset/laposte_hexasmal/download/?format=json&timezone=Europe/Berlin&lang=fr" \
     | jq '[.[].fields | {"codePostal": .code_postal, "codeCommune": .code_commune_insee, "libelleAcheminement": .libelle_d_acheminement, "nomCommune": .nom_de_la_commune}]' >| sources/codes-postaux.json

