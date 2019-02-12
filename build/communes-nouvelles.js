const {parse} = require('node-xlsx')
const {zipObject, groupBy, keyBy, chain} = require('lodash')

const MAINTIENT_DELEGUEES = 'maintien des communes déléguées existantes'
const ASSOCIEES_DELEGUEES = 'les anciennes communes associées deviennent déléguées'

async function extractCommunesNouvellesTable() {
  const [sheet] = parse(`${__dirname}/../sources/communes_nouvelles_2018.xls`, {cellDates: true})
  const [columns, ...rows] = sheet.data
  return rows.map(row => zipObject(columns, row)).filter(r => r.NomCN)
}

async function applyChanges(communesInitiales) {
  const communesIndex = keyBy(communesInitiales, 'code')
  const communesChefLieu = groupBy(communesInitiales, c => {
    return c.chefLieu || c.communeAbsorbante
  })
  const table = await extractCommunesNouvellesTable()

  // Mise à jour des noms de commune
  table.forEach(r => {
    communesIndex[r.DepComA].nom = r.NomCA.trim()
  })

  chain(table)
    .groupBy('DepComN')
    .forEach(membres => {
      const communeNouvelle = membres.find(m => m.DepComN === m.DepComA)

      membres.forEach(m => {
        (communesChefLieu[m.DepComA] || []).forEach(c => {
          c.chefLieu = communeNouvelle.DepComN

          switch (c.type) {
            case 'commune-absorbee':
              break

            case 'commune-associee':
              c.type = communeNouvelle.Commentaire === ASSOCIEES_DELEGUEES ?
                'commune-deleguee' :
                'commune-absorbee'
              break

            case 'commune-deleguee':
              c.type = communeNouvelle.Commentaire === MAINTIENT_DELEGUEES ?
                'commune-deleguee' :
                'commune-absorbee'
              break

            default:
          }
        })

        const commune = communesIndex[m.DepComA]

        if (m.ChefLieu === 'O') {
          commune.chefLieu = undefined
          commune.nom = m.NomCN.trim()
          commune.type = 'commune-actuelle'
        } else {
          commune.chefLieu = m.DepComN
          commune.type = m.ComDLG === 'O' ? 'commune-deleguee' : 'commune-absorbee'
        }
      })
    })
    .value()
}

module.exports = {applyChanges}
