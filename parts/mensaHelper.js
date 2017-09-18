function filterMeals(meals, specialWishes) {
  return meals
    .filter(m => !specialWishes.noPig || !m.Pig)
    .filter(m => !specialWishes.noFish || !m.Fish)
    .filter(m => !specialWishes.lactoseFree || m.LactoseFree)
    .filter(m => !specialWishes.vegan || m.Vegan)
    .filter(m => !specialWishes.vegetarian || m.Vegan || m.Vegetarian)
}

function mensaSpecialWishesButtons(specialWishes) {
  const possibleSettings = []
  if (!specialWishes.vegan) {
    if (!specialWishes.vegetarian) {
      possibleSettings.push('noPig')
      possibleSettings.push('noFish')
    }
    possibleSettings.push('lactoseFree')
    possibleSettings.push('vegetarian')
  }
  possibleSettings.push('vegan')
  return possibleSettings
}

module.exports = {
  filterMeals: filterMeals,
  mensaSpecialWishesButtons: mensaSpecialWishesButtons
}