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

function mensaSpecialWishesButtons(specialWishes) {
  const possibleSettings = []
  possibleSettings.push('vegan')
  if (!specialWishes.vegan) {
    possibleSettings.push('vegetarian')
    possibleSettings.push('lactoseFree')
    if (!specialWishes.vegetarian) {
      possibleSettings.push('noPig')
      possibleSettings.push('noBeef')
      possibleSettings.push('noPoultry')
      possibleSettings.push('noFish')
    }
  }
  return possibleSettings
}

module.exports = {
  filterMeals: filterMeals,
  mensaSpecialWishesButtons: mensaSpecialWishesButtons
}
