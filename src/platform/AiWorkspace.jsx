import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { api, useResource } from "./api.js"
import {
  Badge,
  Empty,
  Heading,
  inputStyle,
  Notice,
  primaryStyle,
  secondaryStyle,
} from "./ui.jsx"
import { Modal } from "./Modal.jsx"
import { ShieldCheck, Settings2 } from "lucide-react"
import { RecordLink } from "./RecordLink.jsx"
import { ResourceState } from "./ResourceState.jsx"
import { TableSkeleton } from "./LoadingStates.jsx"

export function AiConsent({
  status,
  consent,
  onConsent,
  language,
  onLanguage,
  disabled,
  autoOpen = false,
}) {
  const [open, setOpen] = useState(false)
  const announced = useRef(false)
  useEffect(() => {
    if (!autoOpen || !status || announced.current) return
    // Queue automatic notices behind the active guide/task instead of covering
    // its controls with a second native modal. Manual consent stays explicit.
    const announce = () => {
      if (announced.current || document.querySelector("dialog[open]")) return
      announced.current = true
      observer.disconnect()
      setOpen(true)
    }
    const observer = new MutationObserver(announce)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    })
    announce()
    return () => observer.disconnect()
  }, [autoOpen, status])
  return (
    <>
      <section
        aria-label="AI privacy preferences"
        className="my-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:px-5"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              role="switch"
              aria-label="Allow Cohere AI"
              type="checkbox"
              className="size-5 accent-primary"
              checked={consent}
              disabled={disabled || !status}
              onChange={(e) =>
                e.target.checked ? setOpen(true) : onConsent(false)
              }
            />
            <span>Cohere AI {consent ? "on" : "off"}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Language</span>
            <select
              aria-label="AI response language"
              className={`${inputStyle} w-auto`}
              value={language}
              disabled={disabled}
              onChange={(e) => onLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fil">Filipino / Tagalog</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className={secondaryStyle}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <Settings2 size={16} />
          Privacy & consent
        </button>
      </section>
      {open && (
        <Modal
          title="AI privacy & response preferences"
          onClose={() => setOpen(false)}
          initialFocusSelector="input[type=checkbox]"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-primary" size={24} />
              <p className="text-sm leading-7">
                {status?.notice || "Loading external AI privacy notice…"}
              </p>
            </div>
            <a
              className="inline-block text-sm font-semibold underline"
              href="https://cohere.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Cohere privacy policy
            </a>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4 text-sm leading-7">
              <input
                className="mt-1 size-5 shrink-0 accent-primary"
                type="checkbox"
                checked={consent}
                disabled={disabled || !status}
                onChange={(e) => onConsent(e.target.checked)}
              />
              <span>
                I consent to sending the described information to Cohere for
                this AI feature. / Pumapayag akong ipadala ang nabanggit na
                impormasyon para sa AI feature na ito.
              </span>
            </label>
            <label className="block max-w-sm text-sm font-semibold">
              Response language
              <select
                aria-label="Response language"
                className={`${inputStyle} mt-2`}
                value={language}
                disabled={disabled}
                onChange={(e) => onLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fil">Filipino / Tagalog</option>
              </select>
            </label>
            {status && !status.configured && (
              <Notice>
                AI model unavailable: provider access is not configured. The
                clearly labeled TF-IDF baseline remains available.
              </Notice>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <p className="max-w-xl text-xs leading-6 text-muted-foreground">
                You can turn AI off or reopen these preferences at any time.
                Closing this notice never sends your profile to a model.
              </p>
              <button className={primaryStyle} onClick={() => setOpen(false)}>
                Continue {consent ? "with AI enabled" : "without AI"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {status && !status.configured && (
        <p role="status" className="mb-5 text-sm text-muted-foreground">
          AI model unavailable: provider access is not configured. You can
          continue with the TF-IDF baseline.
        </p>
      )}
    </>
  )
}

function TextList({ title, items }) {
  return (
    <section className="mt-5">
      <h3 className="font-semibold">{title}</h3>
      {items?.length ? (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No items suggested.
        </p>
      )}
    </section>
  )
}

export function AiWorkspace() {
  const [params] = useSearchParams()
  const status = useResource("/ai/status")
  const vacancies = useResource("/vacancies")
  const [vacancyId, setVacancyId] = useState(params.get("vacancy") || "")
  const [tab, setTab] = useState("adviser")
  const [language, setLanguage] = useState("en")
  const [consent, setConsent] = useState(false)
  const [useResume, setUseResume] = useState(false)
  const [facts, setFacts] = useState("")
  const [outputOpen, setOutputOpen] = useState(false)
  const latestTurn = useRef(null)
  const [result, setResult] = useState(null)
  const [decisions, setDecisions] = useState({})
  const [practice, setPractice] = useState(null)
  const [answer, setAnswer] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [choices, setChoices] = useState([])
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    setChoices(vacancies.data?.data || [])
  }, [vacancies.data])
  async function findVacancies(e) {
    e.preventDefault()
    setSearching(true)
    setError("")
    try {
      const response = await api(
        `/vacancies?search=${encodeURIComponent(search)}`,
      )
      setChoices(response.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }
  useEffect(() => {
    if (outputOpen && practice && !busy) {
      latestTurn.current?.focus({ preventScroll: true })
      latestTurn.current?.scrollIntoView({ block: "start", behavior: "auto" })
    }
  }, [practice?.version, outputOpen, busy])
  const ready = consent && status.data?.configured && vacancyId && !busy
  const body = () => ({
    vacancy_id: Number(vacancyId),
    consent,
    notice_version: status.data?.notice_version,
    language,
    use_resume: useResume,
  })
  async function run(action) {
    if (!ready) return
    setOutputOpen(true)
    setBusy(true)
    setError("")
    try {
      if (action === "interview") {
        const response = await api("/ai/interviews", "POST", body())
        setPractice(response.data)
        setAnswer("")
      } else {
        setResult(null)
        setDecisions({})
        const response = await api(
          `/ai/${action === "resume" ? "resume-review" : "adviser"}`,
          "POST",
          { ...body(), additional_facts: facts },
        )
        setResult(response)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function sendAnswer(e) {
    e.preventDefault()
    if (!ready || !practice) return
    setBusy(true)
    setError("")
    try {
      const response = await api(
        `/ai/interviews/${practice.id}/answer`,
        "POST",
        { ...body(), version: practice.version, answer },
      )
      setPractice(response.data)
      setAnswer("")
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function erase() {
    setBusy(true)
    setError("")
    try {
      await api(`/ai/interviews/${practice.id}`, "DELETE")
      setPractice(null)
      setAnswer("")
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  function chooseTab(value) {
    setTab(value)
    setResult(null)
    setDecisions({})
    setError("")
  }
  return (
    <>
      <Heading
        title="AI Career Workspace"
        description="Explore a vacancy, improve your résumé, and practise a text interview. Model suggestions support your decisions; PESO and employers review qualifications."
      />
      <div className="flex flex-wrap gap-2" aria-label="AI tools">
        {[
          ["adviser", "Career & skills adviser"],
          ["resume", "Résumé review"],
          ["interview", "Mock interview"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? primaryStyle : secondaryStyle}
            aria-pressed={tab === id}
            disabled={busy}
            onClick={() => chooseTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <ResourceState
        resource={status}
        paginate={false}
        skeleton={
          <p role="status" className="my-5">
            Loading AI configuration…
          </p>
        }
      >
        <AiConsent
          status={status.data}
          consent={consent}
          onConsent={setConsent}
          language={language}
          onLanguage={setLanguage}
          disabled={busy}
        />
      </ResourceState>
      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <form
          onSubmit={findVacancies}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="min-w-0 flex-1 text-sm font-semibold">
            Find a vacancy
            <input
              className={`${inputStyle} mt-2`}
              value={search}
              maxLength={200}
              disabled={busy || Boolean(practice)}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button
            className={secondaryStyle}
            disabled={searching || busy || Boolean(practice)}
          >
            {searching ? "Searching…" : "Search vacancies"}
          </button>
        </form>
        <label className="block text-sm font-semibold">
          Selected vacancy
          <select
            className={`${inputStyle} mt-2`}
            value={vacancyId}
            disabled={busy || Boolean(practice)}
            onChange={(e) => {
              setVacancyId(e.target.value)
              setResult(null)
              setDecisions({})
            }}
          >
            <option value="">Choose a published vacancy</option>
            {vacancyId && !choices.some((v) => String(v.id) === vacancyId) && (
              <option value={vacancyId}>
                Selected vacancy #{vacancyId} (server checks availability)
              </option>
            )}
            {choices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} · {v.organization}
              </option>
            ))}
          </select>
        </label>
        {!!choices.length && (
          <p className="text-xs text-muted-foreground">
            Showing up to 100 matching records. Search to narrow the catalog.
          </p>
        )}
        {vacancies.error && <Notice error>{vacancies.error}</Notice>}
        {!vacancies.loading && !choices.length && (
          <Empty title="No vacancies found">
            Try another search or return when an opportunity is published.
          </Empty>
        )}
        {tab === "adviser" && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={useResume}
              disabled={busy}
              onChange={(e) => setUseResume(e.target.checked)}
            />
            Also send my redacted extracted résumé excerpt
          </label>
        )}
        {tab === "resume" && (
          <>
            <p className="text-sm leading-7">
              Reviews the readable excerpt from your{" "}
              <Link to="/profile" className="font-semibold underline">
                uploaded résumé
              </Link>
              . Review and remove identifiers before uploading. Accepted
              revisions stay in this screen; your PDF is never replaced.
            </p>
            <label className="block text-sm font-semibold">
              Additional facts / answers to follow-up questions
              <textarea
                rows={4}
                className={`${inputStyle} mt-2`}
                value={facts}
                disabled={busy}
                onChange={(e) => setFacts(e.target.value)}
                maxLength={3000}
              />
            </label>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          {vacancyId && (
            <RecordLink to={`/jobs/${vacancyId}`} className={secondaryStyle}>
              Review vacancy details
            </RecordLink>
          )}
          {practice && tab === "interview" ? (
            <button
              className={primaryStyle}
              disabled={busy}
              onClick={() => setOutputOpen(true)}
            >
              Continue interview practice
            </button>
          ) : (
            <button
              className={primaryStyle}
              disabled={!ready}
              onClick={() => run(tab)}
            >
              {busy
                ? "Waiting for model…"
                : tab === "adviser"
                  ? "Generate career advice"
                  : tab === "resume"
                    ? "Review résumé for this vacancy"
                    : "Start five-question practice"}
            </button>
          )}
          {result && !outputOpen && (
            <button
              className={secondaryStyle}
              onClick={() => setOutputOpen(true)}
            >
              Open latest {tab === "resume" ? "résumé review" : "career advice"}
            </button>
          )}
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          Your focused review opens in a large dialog. Closing it keeps this
          session's suggestions and interview answers available until you leave
          or refresh the page.
        </p>
      </section>
      {error && !outputOpen && (
        <div className="my-5">
          <Notice error>{error}</Notice>
        </div>
      )}
      {outputOpen && (
        <Modal
          title={
            tab === "adviser"
              ? "Career & skills advice"
              : tab === "resume"
                ? "Résumé review for your selected vacancy"
                : "Five-question interview practice"
          }
          onClose={() => setOutputOpen(false)}
          busy={busy}
        >
          {busy && (
            <p role="status" className="my-5">
              The model is processing your request. This may take up to 25
              seconds.
            </p>
          )}
          {error && (
            <div className="my-5">
              <Notice error>{error}</Notice>
            </div>
          )}
          {result && (
            <section className="space-y-5" aria-live="polite">
              <Badge>Model-generated suggestion · {result.model}</Badge>
              {tab === "adviser" ? (
                <>
                  <h2 className="mt-5 text-xl font-semibold">
                    Relevant evidence
                  </h2>
                  {result.data.relevant_evidence.map((item, i) => (
                    <div key={i} className="mt-4 border-b border-border pb-4">
                      <blockquote className="text-sm">
                        “{item.quote}”
                      </blockquote>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.relevance} · Source: {item.evidence_id}
                      </p>
                    </div>
                  ))}
                  <TextList
                    title="Requirements not stated in submitted information"
                    items={result.data.not_stated}
                  />
                  <TextList
                    title="Questions to clarify your evidence"
                    items={result.data.questions}
                  />
                  <TextList
                    title="Personalized development steps"
                    items={result.data.steps}
                  />
                  <h3 className="mt-5 font-semibold">
                    Verified system records: training catalog
                  </h3>
                  <p className="my-2 text-sm text-muted-foreground">
                    The database record exists; intake, eligibility and
                    remaining places still require review.
                  </p>
                  {result.data.training.length ? (
                    <ul className="space-y-3">
                      {result.data.training.map((p) => (
                        <li key={p.id}>
                          <RecordLink
                            to={p.url}
                            className="font-semibold underline"
                          >
                            {p.title}
                          </RecordLink>
                          <p className="text-sm">
                            {p.provider} ·{" "}
                            {p.catalog_only
                              ? "Catalog only — express interest"
                              : "Scheduled intake — check current availability"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">
                      No matching record recommended from the supplied database
                      candidates.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {result.scope}
                  </p>
                  {["relevance", "clarity", "completeness"].map((key) => (
                    <section key={key} className="mt-5">
                      <h2 className="font-semibold capitalize">{key}</h2>
                      <p className="mt-2 text-sm leading-7">
                        {result.data[key]}
                      </p>
                    </section>
                  ))}
                  <TextList
                    title="Please clarify before adding details"
                    items={result.data.questions}
                  />
                  {result.data.rejected_suggestions > 0 && (
                    <Notice>
                      System validation withheld{" "}
                      {result.data.rejected_suggestions} proposed rewrite(s)
                      because they did not pass fact-preservation checks. Review
                      the follow-up questions and provide concrete facts before
                      requesting another review.
                    </Notice>
                  )}
                  {result.data.suggestions.map((s, i) => (
                    <article
                      key={i}
                      className="mt-6 border-t border-border pt-5"
                    >
                      <h3 className="font-semibold">
                        Statement revision {i + 1}
                      </h3>
                      <dl className="mt-3 space-y-3 text-sm leading-7">
                        <dt className="font-semibold">Original</dt>
                        <dd>{s.original}</dd>
                        <dt className="font-semibold">Suggested revision</dt>
                        <dd>{s.revision}</dd>
                        <dt className="font-semibold">Reason</dt>
                        <dd>{s.reason}</dd>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className={primaryStyle}
                          aria-pressed={decisions[i] === "accepted"}
                          onClick={() =>
                            setDecisions((d) => ({ ...d, [i]: "accepted" }))
                          }
                        >
                          Accept suggestion
                        </button>
                        <button
                          className={secondaryStyle}
                          aria-pressed={decisions[i] === "rejected"}
                          onClick={() =>
                            setDecisions((d) => ({ ...d, [i]: "rejected" }))
                          }
                        >
                          Reject suggestion
                        </button>
                        {decisions[i] && (
                          <span role="status" className="self-center text-sm">
                            {decisions[i]} · PDF unchanged
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                  {Object.values(decisions).includes("accepted") && (
                    <label className="mt-6 block text-sm font-semibold">
                      Accepted statements — select and copy into your résumé
                      editor
                      <textarea
                        readOnly
                        className={`${inputStyle} mt-2`}
                        rows={5}
                        value={result.data.suggestions
                          .filter((_, i) => decisions[i] === "accepted")
                          .map((s) => s.revision)
                          .join("\n\n")}
                      />
                    </label>
                  )}
                </>
              )}
              <p className="mt-6 text-xs leading-6 text-muted-foreground">
                Review every suggestion against your facts. Missing evidence
                does not mean you lack a skill. These suggestions do not
                establish eligibility or guarantee employment.
              </p>
            </section>
          )}
          {practice && tab === "interview" && (
            <section className="space-y-5" aria-live="polite">
              <Badge>Interview practice only · {practice.model}</Badge>
              <p className="text-sm">
                Rubric: 1 needs detail · 2 developing · 3 clear evidence · 4
                well supported.
              </p>
              {practice.transcript.turns.map((turn, i) => (
                <article
                  key={i}
                  tabIndex={
                    i === practice.transcript.turns.length - 1 ? -1 : undefined
                  }
                  ref={
                    i === practice.transcript.turns.length - 1
                      ? latestTurn
                      : undefined
                  }
                  className="scroll-mt-28 space-y-3 border-t border-border pt-5"
                >
                  {turn.output.feedback.length > 0 && (
                    <>
                      <h3 className="font-semibold">Feedback on answer {i}</h3>
                      <ul className="space-y-3 text-sm">
                        {turn.output.feedback.map((f) => (
                          <li key={f.criterion}>
                            <strong>
                              {f.criterion.replaceAll("_", " ")}: {f.score}/4
                            </strong>
                            <p>{f.comment}</p>
                            {f.evidence_quote && (
                              <blockquote className="mt-1 text-muted-foreground">
                                “{f.evidence_quote}”
                              </blockquote>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm leading-7">
                        Suggested improvement: {turn.output.improvement}
                      </p>
                    </>
                  )}
                  {turn.output.question && (
                    <h3 className="font-semibold">
                      Question {i + 1}: {turn.output.question}
                    </h3>
                  )}
                  {turn.answer && (
                    <p className="whitespace-pre-wrap text-sm leading-7">
                      Your answer: {turn.answer}
                    </p>
                  )}
                  {turn.output.summary && (
                    <>
                      <h3 className="font-semibold">Final practice summary</h3>
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {turn.output.summary}
                      </p>
                    </>
                  )}
                </article>
              ))}
              {!practice.completed_at && (
                <form onSubmit={sendAnswer} className="space-y-3">
                  <label className="block text-sm font-semibold">
                    Your answer
                    <textarea
                      required
                      minLength={3}
                      maxLength={3000}
                      rows={5}
                      className={`${inputStyle} mt-2`}
                      value={answer}
                      disabled={busy}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </label>
                  <button className={primaryStyle} disabled={!ready}>
                    {busy ? "Reviewing answer…" : "Submit answer & continue"}
                  </button>
                </form>
              )}
              <button
                className={secondaryStyle}
                disabled={busy}
                onClick={erase}
              >
                Delete this practice
              </button>
              <p className="text-xs text-muted-foreground">
                Practice transcripts expire after seven days. Refreshing the
                page clears this screen; no answers are saved in browser
                storage.
              </p>
            </section>
          )}
        </Modal>
      )}
    </>
  )
}
