const fs = require('fs')

const filesNames = [
  'arrondissements',
  'communes',
  'departements',
  'epci',
  'ept',
  'regions'
]

for (const file of filesNames) {
  module.exports[file] = JSON.parse(fs.readFileSync(`./data/${file}.json`, "utf8"));
}

