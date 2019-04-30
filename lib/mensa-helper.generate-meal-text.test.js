import test from 'ava'

const {generateMealText} = require('./mensa-helper')

const example = {
  Additives: [{
    Key: 'La',
    Value: 'Milch/-erzeugnisse (einschl. Laktose)'
  }],
  Beef: false,
  Date: '/Date(1536883200000+0000)/',
  Fish: false,
  LactoseFree: false,
  Name: '4 Röstiecken, Kräuterquark (La), Gurkensalat (La)',
  Pig: false,
  Poultry: false,
  PriceAttendant: 3.75,
  PriceGuest: 4.7,
  PriceStudent: 2.45,
  Vegan: false,
  Vegetarian: true
}

test('shows hint when something is filtered', t => {
  const result = generateMealText([example], {
    vegan: true
  })
  t.regex(result, /Sonderwünsche/)
})

test('does not show hint when nothing is filtered while having filters', t => {
  const result = generateMealText([example], {
    noPig: true
  })
  t.notRegex(result, /Sonderwünsche/)
})

test('show no meals today', t => {
  const result = generateMealText([])
  t.regex(result, /bietet heute nichts an/)
})

test('has meal', t => {
  const result = generateMealText([example])
  t.regex(result, /Gurkensalat/)
})

test('even amount of markdown bold markers without showAdditives', t => {
  const result = generateMealText([example], {
    showAdditives: false
  })
  t.log(result)
  const occurrences = (result.match(/\*/g) || []).length
  t.is(occurrences, 2)
})

test('even amount of markdown bold markers with showAdditives', t => {
  const result = generateMealText([example], {
    showAdditives: true
  })
  t.log(result)
  const occurrences = (result.match(/\*/g) || []).length
  t.is(occurrences, 4)
})
