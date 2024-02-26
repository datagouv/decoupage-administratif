#!/usr/bin/env bash
# See list of files to get a snapshot of La Poste API codes postaux content at
# http://files.opendatarchives.fr/datanova.laposte.fr/archives/laposte_hexasmal/
# url=http://files.opendatarchives.fr/datanova.laposte.fr/archives/laposte_hexasmal/20210103T030121Z%20laposte_hexasmal.csv.gz
# wget $url
# compressed_encoded_file_name="${url##*/}"
# compressed_file_name=$(echo $compressed_encoded_file_name | sed "s/%20/ /g")
# unp "$compressed_file_name"
# csv_encoded_name=${compressed_file_name%.*}
# csv_name=$(echo $csv_encoded_name | sed "s/%20/ /g")
# echo "codeCommune;nomCommune;codePostal;Ligne_5;libelleAcheminement;coordonnees_gps" >| codes-postaux.csv
# sed -e "1d" "$csv_name" >> codes-postaux.csv
# csvcut -d ';' -c '1-3,5' codes-postaux.csv | csv2json |jq . >| sources/codes-postaux.json
# jq -c '.[]' sources/codes-postaux.json sources/codes-postaux-missing.json | jq -s . >| sources/codes-postaux-with-fix.json
# rm "$csv_name"* codes-postaux.csv
# Useful when need to take latest CSV file
wget https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/metadata-attachments/base-officielle-codes-postaux.csv
sed -i 's/code_commune_insee/codeCommune/g' base-officielle-codes-postaux.csv
sed -i 's/code_postal/codePostal/g' base-officielle-codes-postaux.csv
sed -i 's/libelle_d_acheminement/libelleAcheminement/g' base-officielle-codes-postaux.csv
sed -i 's/nom_de_la_commune/nomCommune/g' base-officielle-codes-postaux.csv
csv2json base-officielle-codes-postaux.csv | jq '[.[] | {"codePostal": .codePostal, "codeCommune": .codeCommune, "libelleAcheminement": .libelleAcheminement, "nomCommune": .nomCommune}]' >| sources/codes-postaux.json
# To fix missing postal codes
jq -c '.[]' sources/codes-postaux.json sources/codes-postaux-missing.json | jq --slurp '.' >| sources/codes-postaux-with-fix.json
