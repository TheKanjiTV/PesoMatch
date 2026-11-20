import { useState } from "react"
import { Editor, secondaryStyle } from "./ui.jsx"
import { accountRequest } from "../services/account.js"

export function ResumeProfileReview({ resume, onReviewed }) {
  const [kind, setKind] = useState(null)
  const detected = resume.detected || {}
  const work = kind === "experience"
  const excerpt = work
    ? detected.experience_excerpt
    : detected.certifications_excerpt
  const fields = work
    ? [
        { name: "job_title", label: "Job title", maxLength: 255 },
        { name: "company_name", label: "Employer / company", maxLength: 255 },
        {
          name: "industry",
          label: "Industry (optional)",
          required: false,
          maxLength: 255,
        },
        {
          name: "employment_type",
          label: "Employment type (optional)",
          required: false,
          options: [
            "Full-time",
            "Part-time",
            "Contract",
            "Temporary",
            "Internship",
            "Self-employed",
          ],
        },
        { name: "start_date", label: "Exact start date", type: "date" },
        {
          name: "is_current",
          label: "Do you currently work here?",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        {
          name: "end_date",
          label: "Exact end date",
          type: "date",
          when: (v) => v.is_current !== "yes",
        },
        {
          name: "description",
          label: "Reviewed duties / experience",
          type: "textarea",
          required: false,
          maxLength: 5000,
        },
      ]
    : [
        {
          name: "certification_name",
          label: "Certificate / course name",
          maxLength: 255,
        },
        {
          name: "issuing_organization",
          label: "Issuing organization (optional)",
          required: false,
          maxLength: 255,
        },
        {
          name: "issued_at",
          label: "Exact issue date (leave blank if only a year is stated)",
          type: "date",
          required: false,
        },
        {
          name: "credential_reference",
          label: "Credential reference (optional)",
          required: false,
          maxLength: 255,
        },
      ]
  fields.push({
    name: "reviewed",
    label: "Confirm these profile facts",
    options: [
      {
        value: "yes",
        label:
          "I reviewed these details and confirm they describe my own experience or certificate.",
      },
    ],
  })
  return (
    <>
      <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
        {[
          ["experience", "Work experience", detected.experience_excerpt],
          [
            "certification",
            "Certificates & short courses",
            detected.certifications_excerpt,
          ],
        ].map(([id, title, text]) => (
          <section key={id} className="min-w-0">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {id === "experience"
                ? "Adding skills does not create a work-history entry. Review the job, employer and dates here before saving."
                : "Completion certificates belong in Skills & qualifications, not formal education. Review one certificate at a time."}
            </p>
            {text ? (
              <blockquote className="my-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-7">
                {text}
              </blockquote>
            ) : (
              <p className="my-3 text-sm text-muted-foreground">
                No separate section detected. You can still enter your own
                confirmed details; missing text is not proof that you lack
                experience or a certificate.
              </p>
            )}
            <button
              type="button"
              className={secondaryStyle}
              onClick={() => setKind(id)}
            >
              {id === "experience"
                ? "Review & add work experience"
                : "Review & add certificate"}
            </button>
          </section>
        ))}
      </div>
      {kind && (
        <Editor
          title={
            work
              ? "Review work experience from your PDF"
              : "Review certificate from your PDF"
          }
          initial={work ? { ...detected.experience_draft, is_current: "" } : {}}
          fields={fields}
          help="Only the facts you confirm are saved. Missing job details or exact dates are never invented. Existing profile entries remain."
          context={
            excerpt && (
              <details className="mb-5 rounded-lg bg-muted p-4" open>
                <summary className="cursor-pointer text-sm font-semibold">
                  Extracted PDF evidence
                </summary>
                <blockquote className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-sm leading-7">
                  {excerpt}
                </blockquote>
              </details>
            )
          }
          submitLabel={
            work ? "Add reviewed work experience" : "Add reviewed certificate"
          }
          onClose={() => setKind(null)}
          onSave={async (v) => {
            const body = { ...v, reviewed: v.reviewed === "yes" }
            if (work) {
              body.is_current = v.is_current === "yes"
              if (body.is_current) body.end_date = null
            }
            const result = await accountRequest(
              `/api/jobseeker/resume/${kind}`,
              { method: "POST", body },
            )
            await onReviewed?.(kind, result.entry, result.message)
          }}
        />
      )}
    </>
  )
}
