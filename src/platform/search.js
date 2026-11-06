export const SEARCH_LIMIT = 200

export function searchError(value) {
  if ([...value].length > SEARCH_LIMIT)
    return `Use ${SEARCH_LIMIT} characters or fewer.`
  if (/[\u0000-\u001f\u007f]/u.test(value))
    return "Remove line breaks or control characters from your search."
  return ""
}

export function normalizeSearch(value) {
  return searchError(value) ? "" : value.trim().replace(/\s+/gu, " ")
}

export function searchSuggestions(records, value, fields) {
  const query = normalizeSearch(value).toLocaleLowerCase()
  if (!query) return []
  const values = records.flatMap((row) =>
    fields.flatMap((key) => row[key] || []),
  )
  return [
    ...new Set(
      values.filter(
        (v) => typeof v === "string" && v.toLocaleLowerCase().includes(query),
      ),
    ),
  ]
    .sort(
      (a, b) =>
        Number(b.toLocaleLowerCase().startsWith(query)) -
        Number(a.toLocaleLowerCase().startsWith(query)),
    )
    .slice(0, 8)
}
