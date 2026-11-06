import { Notice } from "./ui.jsx"

export function PesoVacancySource() {
  return (
    <div className="mb-5">
      <Notice>
        <div>
          <p className="font-semibold">Reviewed listings from Pasay City PESO</p>
          <p className="mt-1">
            This collection covers Pasay PESO listings, not all Philippine
            vacancies. Open each official listing for its application form and
            confirm availability and the work location with PESO or the employer.
            A checked date records a page review, not a hiring confirmation.
          </p>
          <a
            href="https://pasay.gov.ph/job-openings/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            Browse the official Pasay PESO job board
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </Notice>
    </div>
  )
}
