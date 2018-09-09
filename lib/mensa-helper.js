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

module.exports = {
  filterMeals
}
