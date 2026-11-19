import { Link } from "react-router"
import { useEffect, useState } from "react"

import { FileText, Upload, Trash2 } from "lucide-react"

import { accountRequest } from "../services/account.js"

import { Notice, primaryStyle, secondaryStyle } from "./ui.jsx"

import { ResumeSkeleton } from "./LoadingStates.jsx"

import { withMinimumLoading } from "./loading.js"

import { useWorkspaceActivity } from "./WorkspaceLoading.jsx"

import { CollectionNotice } from "./CollectionNotice.jsx"

export function ResumePanel({ onApplied }) {
  const [resume, setResume] = useState(null),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState([]),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [mobile, setMobile] = useState(false)

  useWorkspaceActivity(loading)

  function accept(row) {
    setResume(row)

    setSelected(row?.detected.skills.map((s) => s.id) || [])

    setMobile(false)
  }

  useEffect(() => {
    let active = true

    withMinimumLoading(() => accountRequest("/api/jobseeker/resume"))
      .then((r) => {
        if (active) accept(r.data)
      })

      .catch((e) => {
        if (active) setError(e.message)
      })

      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function run(action) {
    setBusy(true)

    setError("")

    setMessage("")

    try {
      await action()
    } catch (e) {
      setError(
        Object.values(e.errors || {})

          .flat()

          .join(" ") || e.message,
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ResumeSkeleton />

  return (
    <section
      className="resume-panel mb-7 rounded-lg border border-border bg-card p-5 sm:p-7"
      aria-labelledby="resume-title"
    >
      <Link to="/ai-workspace" className={`${secondaryStyle} mb-5`}>
        Review this résumé against a vacancy with AI
      </Link>
      <div className="flex items-start gap-3">
        <FileText size={24} className="shrink-0 text-primary" />
        <div>
          <h2 id="resume-title" className="text-xl font-semibold text-primary">
            Build your profile from a résumé
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload a PDF, review detected skills, and add them to your profile
            for job matching. Your existing skills stay saved.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CollectionNotice kind="resume" />
      </div>
      <label
        className="mt-5 block text-sm font-semibold"
        htmlFor="resume-upload"
      >
        Résumé PDF · up to 5 MB
      </label>

      <input
        id="resume-upload"
        type="file"
        accept="application/pdf,.pdf"
        disabled={busy}
        className="mt-2 block w-full min-w-0 rounded border border-border p-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-primary"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        Use selectable text. Image/scanned PDFs need OCR first. The first 20
        pages are read privately on this server.
      </p>

      <button
        type="button"
        disabled={!file || busy}
        className={`${primaryStyle} mt-4`}
        onClick={() =>
          run(async () => {
            const body = new FormData()

            body.append("resume", file)

            const r = await accountRequest("/api/jobseeker/resume", {
              method: "POST",

              body,
            })

            accept(r.data)

            setMessage(
              "PDF analyzed. Review the evidence before adding skills.",
            )
          })
        }
      >
        <Upload size={17} />
        {busy ? "Working…" : "Analyze PDF"}
      </button>

      {error && (
        <div className="mt-4">
          <Notice error>{error}</Notice>
        </div>
      )}
      {message && (
        <div className="mt-4">
          <Notice>{message}</Notice>
        </div>
      )}

      {resume && (
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="break-all text-sm font-semibold">{resume.filename}</p>
            <a
              className="text-sm font-semibold text-primary underline"
              href="/api/jobseeker/resume/download"
            >
              Download my PDF
            </a>
          </div>

          <h3 className="mt-5 font-semibold">Detected skills</h3>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            A mention does not prove proficiency. Uncheck anything that does not
            describe your skills.
          </p>

          {!resume.detected.skills.length && (
            <p className="mt-4 text-sm">
              No catalog skills detected. You can add your skills manually
              below.
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resume.detected.skills.map((s) => (
              <label
                key={s.id}
                className="flex items-start gap-3 rounded border border-border p-3"
              >
                <input
                  type="checkbox"
                  aria-label={s.name}
                  aria-describedby={`resume-evidence-${s.id}`}
                  className="mt-1 size-5 shrink-0 accent-primary"
                  checked={selected.includes(s.id)}
                  disabled={busy}
                  onChange={(e) =>
                    setSelected((v) =>
                      e.target.checked
                        ? [...v, s.id]
                        : v.filter((x) => x !== s.id),
                    )
                  }
                />
                <span className="min-w-0">
                  <strong className="text-sm">{s.name}</strong>
                  <span
                    id={`resume-evidence-${s.id}`}
                    className="mt-1 block break-words text-xs leading-6 text-muted-foreground"
                  >
                    {s.evidence}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {resume.detected.mobile_number && (
            <label className="mt-5 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={mobile}
                onChange={(e) => setMobile(e.target.checked)}
              />
              Use detected mobile number: {resume.detected.mobile_number}
            </label>
          )}

          {[
            ["Education", resume.detected.education_excerpt],

            ["Work experience", resume.detected.experience_excerpt],
          ]

            .filter((x) => x[1])

            .map(([label, value]) => (
              <details className="mt-4 text-sm" key={label}>
                <summary className="cursor-pointer font-semibold">
                  {label} found in the PDF
                </summary>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">
                  {value}
                </p>
                <p className="mt-2 text-xs">
                  Review this text when completing the corresponding profile
                  form. Dates and qualifications are not inferred.
                </p>
              </details>
            ))}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || (!selected.length && !mobile)}
              className={primaryStyle}
              onClick={() =>
                run(async () => {
                  const r = await accountRequest(
                    "/api/jobseeker/resume/apply",

                    {
                      method: "POST",

                      body: { skills: selected, apply_mobile: mobile },
                    },
                  )

                  setResume(r.data)

                  setMessage(r.message)

                  await onApplied?.(selected)
                })
              }
            >
              Add reviewed skills
            </button>
            <button
              type="button"
              disabled={busy}
              className={secondaryStyle}
              onClick={() =>
                run(async () => {
                  await accountRequest("/api/jobseeker/resume", {
                    method: "DELETE",
                  })

                  accept(null)

                  setFile(null)

                  setMessage(
                    "Résumé deleted. Previously added profile skills remain.",
                  )
                })
              }
            >
              <Trash2 size={16} />
              Delete PDF
            </button>
          </div>

          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            {resume.detected.note}
          </p>
        </div>
      )}
    </section>
  )
}
