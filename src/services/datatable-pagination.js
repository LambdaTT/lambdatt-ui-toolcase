/**
 * Cálculo puro da paginação do DataTable (spec 076).
 *
 * Extraído do componente para uma função sem estado/efeitos: o total de páginas
 * (`finalPage`) e a janela de botões (`pages`) derivam SEMPRE do total real de
 * registros (`totalItems`, vindo do fullData), não da fatia já limitada pelo
 * servidor. Assim os botões "Próxima"/"Última" e os números refletem o total —
 * antes o cálculo usava o tamanho da página (≤ limit) e colapsava tudo em 1
 * página, tornando os registros além do limite inacessíveis.
 *
 * Enquanto o total ainda está em voo (`totalItems == 0`), cai no fallback
 * transitório sobre a fatia corrente — corrigido assim que o total chega.
 */

/** Janela de até 5 botões terminando em finalPage, aproximadamente centrada em currentPage. */
function buildPageWindow(currentPage, finalPage) {
  let initial
  if (finalPage - currentPage < 1) initial = currentPage - 4
  else if (finalPage - currentPage < 2) initial = currentPage - 3
  else initial = currentPage - 2
  initial = initial < 1 ? 1 : initial

  const pages = []
  for (let i = initial; i <= finalPage; i++) {
    pages.push(i)
    if (pages.length > 4) break
  }
  return pages
}

/**
 * @param {object} p
 * @param {number} p.totalItems - total de registros (fullData); 0 = ainda carregando.
 * @param {number} p.pageItems  - registros na fatia corrente (rawData da página).
 * @param {number} p.currentPage
 * @param {number} p.limit
 * @returns {{ finalPage: number, pages: number[] }}
 */
export function computePagination({ totalItems, pageItems, currentPage, limit }) {
  const finalPage =
    totalItems > 0
      ? Math.ceil(totalItems / limit)
      : currentPage + (Math.ceil(pageItems / limit) - 1)

  return { finalPage, pages: buildPageWindow(currentPage, finalPage) }
}

export default { computePagination }
