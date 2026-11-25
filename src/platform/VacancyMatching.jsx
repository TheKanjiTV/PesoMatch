import { useAiPreferences } from "./AiPreferences.jsx"
import { useEffect, useState } from "react"
import { AiConsent } from "./AiWorkspace.jsx"
import { api, useResource } from "./api.js"
import { Badge, Notice, secondaryStyle } from "./ui.jsx"

export function VacancyMatchTools({ records, onChange }) {
  const status = useResource("/ai/status")
  const { consent, setConsent, language, setLanguage } = useAiPreferences()
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState("")
  const ids = records
    .filter((v) => !v.is_sample)
    .map((v) => v.id)
    .join(",")
  useEffect(() => {
    let active = true
    setError("")
    onChange({ active: consent, scores: {}, loading: consent })
    if (!consent || !ids || !status.data?.configured)
      return () => {
        active = false
      }
    async function load() {
      try {
        const all = ids.split(",").map(Number)
        const scores = {}
        for (let i = 0; i < all.length; i += 100) {
          if (!active) return
          const result = await api("/ai/vacancy-matches", "POST", {
            vacancy_ids: all.slice(i, i + 100),
            consent: true,
            notice_version: status.data.notice_version,
            language,
          })
          Object.assign(scores, result.scores)
          if (active)
            onChange({
              active: true,
              scores: { ...scores },
              loading: i + 100 < all.length,
            })
        }
      } catch (e) {
        if (active) {
          setError(e.message)
          onChange({ active: true, scores: {}, loading: false })
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [consent, ids, status.data, retry, language, onChange])
  return (
    <>
      <AiConsent
        status={status.data}
        consent={consent}
        onConsent={setConsent}
        language={language}
        onLanguage={setLanguage}
      />
      {status.error && <Notice error>{status.error}</Notice>}
      {error && (
        <Notice error>
          {error}{" "}
          <button
            className={`${secondaryStyle} ml-3`}
            onClick={() => setRetry(retry + 1)}
          >
            Retry matching
          </button>
        </Notice>
      )}
    </>
  )
}

export function VacancyMatchScore({ record, state }) {
  const value = state?.active
    ? state.scores[record.id]
    : record.assessment?.score
  return (
    <Badge>
      <span aria-label="Profile match">
        {Number.isFinite(value)
          ? `${value}% match`
          : state?.loading
            ? "Matching…"
            : "Match unavailable"}
      </span>
    </Badge>
  )
}
