function filterMeals(meals, specialWishes) {
  return meals
    .filter(m => !specialWishes.noBeef || !m.Beef)
    .filter(m => !specialWishes.noFish || !m.Fish)
    .filter(m => !specialWishes.noPig || !m.Pig)
    .filter(m => !specialWishes.noPoultry || !m.Poultry)
    .filter(m => !specialWishes.lactoseFree || m.LactoseFree)
    .filter(m => !specialWishes.vegan || m.Vegan)
    .filter(m => !specialWishes.vegetarian || m.Vegan || m.Vegetarian)
}

function generateMealText(meals, mensaSettings = {}) {
  if (meals.length === 0) {
    return 'Die Mensa bietet heute nichts an.'
  }

  const hints = []

  const filtered = filterMeals(meals, mensaSettings)
  const mealTexts = filtered.map(m => mealToMarkdown(m, mensaSettings.price, mensaSettings.showAdditives))

  const hasFilters = mensaSettings.noPig || mensaSettings.noFish || mensaSettings.lactoseFree || mensaSettings.vegetarian || mensaSettings.vegan

  if (hasFilters && meals.length !== filtered.length) {
    hints.push('⚠️ Durch deine Sonderwünsche siehst du nicht jede Mahlzeit. Dies kannst du in den /settings einstellen.')
  }

  const hintText = hints
    .map(o => o + '\n')
    .join('\n')
  if (mealTexts.length === 0) {
    return hintText + '\nDie Mensa hat heute nichts für dich.'
  }

  return hintText + '\n' + mealTexts.join('\n\n')
}

function mealToMarkdown(meal, priceClass, showAdditives) {
  const parsedName = showAdditives ?
    meal.Name
      .replace(/ \(/g, '* (')
      .replace(/\), /g, '), *')
      .replace(/([^)])$/, '$1*') :
    meal.Name.replace(/\s*\([^)]+\)\s*/g, '') + '*'

  const price = priceClass === 'student' ? meal.PriceStudent : priceClass === 'attendant' ? meal.PriceAttendant : meal.PriceGuest
  const priceStr = price.toLocaleString('de-DE', {minimumFractionDigits: 2}).replace('.', ',')

  let text = `*${parsedName}\n`
  text += `${priceStr} €`

  const infos = []

  if (meal.Pig) {
    infos.push('🐷')
  }

  if (meal.Beef) {
    infos.push('🐮')
  }

  if (meal.Poultry) {
    infos.push('🐔')
  }

  if (meal.Fish) {
    infos.push('🐟')
  }

  if (meal.LactoseFree) {
    infos.push('laktosefrei')
  }

  if (meal.Vegan) {
    infos.push('vegan')
  }

  if (meal.Vegetarian) {
    infos.push('vegetarisch')
  }

  if (infos.length > 0) {
    text += ' ' + infos.join(' ')
  }

  if (showAdditives) {
    for (const additive of meal.Additives) {
      text += `\n${additive.Key}: ${additive.Value}`
    }
  }

  return text
}

module.exports = {
  filterMeals,
  generateMealText,
  mealToMarkdown
}
