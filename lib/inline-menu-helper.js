function filteredOptions(menu, {
  uniqueQuestionText,
  uniqueIdentifier,
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
    uniqueIdentifier,
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
    getCurrentPage: ctx => ctx.session.page,
    setPage: (ctx, page) => {
      ctx.session.page = page
    },
    setFunc,
    isSetFunc,
    prefixFunc
  })
}

module.exports = {
  filteredOptions
}
