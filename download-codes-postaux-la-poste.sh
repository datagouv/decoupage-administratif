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
wget https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/data-files/019HexaSmal.csv
echo '"codeCommune","nomCommune","codePostal","libelleAcheminement","ligne_5"' >| 019HexaSmal_changed_headers.csv
tail -n +2 019HexaSmal.csv >> 019HexaSmal_changed_headers.csv
sed -i 's/;/,/g' 019HexaSmal_changed_headers.csv
csv2json 019HexaSmal_changed_headers.csv | jq '[.[] | {"codePostal": .codePostal, "codeCommune": .codeCommune, "libelleAcheminement": .libelleAcheminement, "nomCommune": .nomCommune}]' >| sources/codes-postaux.json
# To fix missing postal codes
jq -c '.[]' sources/codes-postaux.json sources/codes-postaux-missing.json | jq --slurp '.' >| sources/codes-postaux-with-fix.json
