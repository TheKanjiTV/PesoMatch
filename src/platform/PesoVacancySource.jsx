import { Notice } from "./ui.jsx"
import { useResource } from "./api.js"

export function PesoVacancySource({ training = false, onArea }) {
  const coverage = useResource("/source-coverage", "/api/public")
  return (
    <div className="mb-5">
      <Notice>
        <div>
          <p className="font-semibold">
            {training
              ? "Official TESDA and overseas training sources"
              : "Reviewed PESO and government sources"}
          </p>
          <p className="mt-1">
            {training
              ? "Registered programs are listed for reference; registration does not confirm an open intake, scholarship or fee. Check each provider's current enrollment instructions."
              : "Coverage varies by office. Source-listed openings and postings that need confirmation are labeled separately. A checked date records a review, not a guarantee of remaining vacancies."}
          </p>
          {onArea && (
            <div
              className="mt-2 flex flex-wrap gap-x-4 gap-y-1"
              aria-label="Search priority locations"
            >
              {[
                "Oriental Mindoro",
                "Occidental Mindoro",
                "Palawan",
                "Puerto Princesa",
              ].map((area) => (
                <button
                  key={area}
                  className="min-h-11 text-left font-semibold underline underline-offset-4"
                  onClick={() => onArea(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold underline underline-offset-4">
              Official sources and coverage by area
            </summary>
            {coverage.loading ? (
              <div
                role="status"
                aria-label="Loading source coverage"
                aria-busy="true"
                className="space-y-3 py-3 motion-safe:animate-pulse"
              >
                <div className="h-4 w-3/4 rounded bg-border" />
                <div className="h-4 w-full rounded bg-border" />
                <div className="h-4 w-2/3 rounded bg-border" />
              </div>
            ) : coverage.error ? (
              <p className="py-3">
                Source coverage could not be loaded. Try again after checking
                your connection.
              </p>
            ) : (
              <>
                <p className="py-3 text-xs">
                  Reviewed{" "}
                  {coverage.data?.review_date ||
                    "on the date shown on each record"}
                  . This is a reviewed selection, not a complete feed from every
                  PESO office. No verified posting here does not mean there are
                  no local opportunities.
                </p>
                <ul className="divide-y divide-border">
                  {(coverage.data?.sources || []).map((source) => (
                    <li key={source.url} className="py-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                      >
                        {source.area} · {source.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <p className="mt-1 font-medium">{source.status}</p>
                      <p className="mt-1 text-sm leading-6">{source.notes}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </details>
        </div>
      </Notice>
    </div>
  )
}
