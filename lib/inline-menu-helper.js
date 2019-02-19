function filteredOptions(menu, {
  uniqueQuestionText,
  getCurrentFilterFunc,
  setCurrentFilterFunc,
  getFilteredOptionsFunc,
  columns,
  maxRows,
  setFunc,
  isSetFunc,
  prefixFunc
}) {
  async function filterButtonText(ctx) {
    let text = '🔎 Filter'
    const currentFilter = await getCurrentFilterFunc(ctx)
    if (currentFilter && currentFilter !== '.+') {
      text += ': ' + currentFilter
    }

    return text
  }

  menu.question(filterButtonText, 'filter', {
    setFunc: (ctx, answer) => setCurrentFilterFunc(ctx, answer),
    questionText: uniqueQuestionText
  })

  menu.button('Filter aufheben', 'clearfilter', {
    doFunc: ctx => setCurrentFilterFunc(ctx, '.+'),
    joinLastRow: true,
    hide: async ctx => {
      const currentFilter = await getCurrentFilterFunc(ctx)
      return !currentFilter || currentFilter === '.+'
    }
  })

  async function getObjects(ctx) {
    const currentFilter = await getCurrentFilterFunc(ctx)
    return getFilteredOptionsFunc(ctx, currentFilter || '.+')
  }

  menu.select('s', getObjects, {
    columns,
    maxRows,
    setFunc,
    isSetFunc,
    prefixFunc
  })
}

module.exports = {
  filteredOptions
}
