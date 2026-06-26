export function sortWashServicesForDisplay(list) {
  return [...list].sort((a, b) => {
    const ao = Number(a.sortOrder)
    const bo = Number(b.sortOrder)
    const aOk = Number.isFinite(ao)
    const bOk = Number.isFinite(bo)
    if (aOk && bOk && ao !== bo) return ao - bo
    if (aOk && !bOk) return -1
    if (!aOk && bOk) return 1
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  })
}
