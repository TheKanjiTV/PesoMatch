import { Link } from "react-router"

const resources = [
  {
    name: "Find your local PESO",
    detail:
      "Use the Bureau of Local Employment directory to find an office in your area. Regional entries may have older dates; confirm local contact details with the office.",
    source: "https://ble.dole.gov.ph/peso-directory/",
  },
  {
    name: "DOLE · Bureau of Local Employment",
    detail: "General questions about employment programs and services.",
    source: "https://ble.dole.gov.ph/the-bureau/",
    email: "ble@dole.gov.ph",
    phone: "+63 2 8528 0087",
    dial: "+63285280087",
  },
  {
    name: "Pasay City PESO job board",
    detail:
      "Official PESO vacancy details and application forms. Confirm the work location and current availability on each listing.",
    source: "https://pasay.gov.ph/job-openings/",
  },
  {
    name: "TESDA public assistance",
    detail:
      "Questions about TESDA training, assessment and official provider information.",
    source: "https://www.tesda.gov.ph/directory",
    email: "contactcenter@tesda.gov.ph",
    phone: "+63 2 8887 7777",
    dial: "+63288877777",
  },
  {
    name: "National Privacy Commission",
    detail:
      "General privacy questions and guidance on complaints. See the official contact page for the appropriate division.",
    source: "https://privacy.gov.ph/contactus/",
    phone: "+63 2 5322 1322",
    dial: "+63253221322",
  },
]

const linkStyle =
  "inline-flex min-h-11 items-center break-all font-semibold text-primary underline underline-offset-4"
export function OfficialHelp() {
  return (
    <>
      <section className="mb-7 text-sm leading-7 text-muted-foreground">
        <h2 className="mb-2 text-base font-semibold text-primary">
          Help with PesoMatch
        </h2>
        <p>
          For a saved account's privacy concern, use{" "}
          <Link className={linkStyle} to="/settings">
            Account Settings → Your privacy requests
          </Link>
          . The platform's verified operator, support contact and privacy
          officer are still pending. If you cannot sign in, the platform's own
          external support channel is not yet configured.
        </p>
      </section>
      <section
        className="text-sm leading-7 text-muted-foreground"
        aria-labelledby="official-help-title"
      >
        <h2
          id="official-help-title"
          className="text-base font-semibold text-primary"
        >
          External government resources
        </h2>
        <p className="mt-2">
          These agencies provide their own services. Listing their public
          contacts does not identify them as PesoMatch's operator, support desk
          or DPO, or establish a partnership. No profile or résumé is sent by
          this page. Only share information needed for your inquiry.
        </p>
        <p className="mt-2 text-xs">
          General contacts checked 13 October 2026; Pasay PESO job board checked
          6 November 2026. Confirm current channels on each official page.
        </p>
        <ul className="mt-5 space-y-5">
          {resources.map((resource) => (
            <li key={resource.name} className="border-t border-border pt-4">
              <h3 className="font-semibold text-primary">{resource.name}</h3>
              <p className="mt-2">{resource.detail}</p>
              <div className="mt-2 flex flex-col items-start">
                {resource.email && (
                  <a className={linkStyle} href={`mailto:${resource.email}`}>
                    {resource.email}
                  </a>
                )}
                {resource.phone && (
                  <a className={linkStyle} href={`tel:${resource.dial}`}>
                    {resource.phone}
                  </a>
                )}
                <a
                  className={linkStyle}
                  href={resource.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.name}: official source
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
