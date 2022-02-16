#!/usr/bin/env bash
# See list of files to get a snapshot of La Poste API codes postaux content at
# http://files.opendatarchives.fr/datanova.laposte.fr/archives/laposte_hexasmal/
url=http://files.opendatarchives.fr/datanova.laposte.fr/archives/laposte_hexasmal/20210103T030121Z%20laposte_hexasmal.csv.gz
wget $url
compressed_encoded_file_name="${url##*/}"
compressed_file_name=$(echo $compressed_encoded_file_name | sed "s/%20/ /g")
unp "$compressed_file_name"
csv_encoded_name=${compressed_file_name%.*}
csv_name=$(echo $csv_encoded_name | sed "s/%20/ /g")
echo "codeCommune;nomCommune;codePostal;Ligne_5;libelleAcheminement;coordonnees_gps" >| codes-postaux.csv
sed -e "1d" "$csv_name" >> codes-postaux.csv
csvcut -d ';' -c '1-3,5' codes-postaux.csv | csv2json |jq . >| sources/codes-postaux.json
jq -c '.[]' sources/codes-postaux.json sources/codes-postaux-missing.json | jq -s . >| sources/codes-postaux-with-fix.json
rm "$csv_name"* codes-postaux.csv
# Useful only if live
#curl "https://datanova.legroupe.laposte.fr/explore/dataset/laposte_hexasmal/download/?format=json&timezone=Europe/Berlin&lang=fr" \
#     | jq '[.[].fields | {"codePostal": .code_postal, "codeCommune": .code_commune_insee, "libelleAcheminement": .libelle_d_acheminement, "nomCommune": .nom_de_la_commune}]' >| sources/codes-postaux.json

