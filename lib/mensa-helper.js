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

function mealToMarkdown(meal, priceClass, showAdditives) {
  const parsedName = showAdditives ?
    meal.Name
      .replace(/ \(/g, '* (')
      .replace(/\), /g, '), *')
      .replace(/([^)])$/, '$1*') :
    meal.Name.replace(/\s*\([^)]+\)\s*/g, '') + '*'

  const price = priceClass === 'student' ? meal.PriceStudent : priceClass === 'attendant' ? meal.PriceAttendant : meal.PriceGuest
  const priceStr = price.toLocaleString('de-DE', {minimumFractionDigits: 2})

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
  mealToMarkdown
}
