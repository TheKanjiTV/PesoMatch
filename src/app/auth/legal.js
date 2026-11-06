// Implementation-based drafts. Operator, lawful basis and retention need approval.
export const legalNotices = {
  "/privacy": {
    title: "Privacy & Your Information",
    sections: [
      [
        "About this notice",
        "Draft v2026-10-13. PesoMatch is an academic implementation of an AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO). It does not claim government adoption. The responsible PESO/operator, address and privacy officer contact have not yet been verified or configured. This draft must be approved and completed before public operation with personal data.",
      ],
      [
        "Information you provide",
        "Registration collects your name, email, password and optional mobile number. Profiling collects birth date, contact and location, education, declared skills, optional professional license and certification details, work history and employment preferences. Sex is optional. Service records include referral and enrollment requests, appointment details, placement evidence, employment reports and information you write to staff. Do not submit unrelated government identification numbers, bank details, health records or other unnecessary sensitive information.",
      ],
      [
        "Optional résumé and recommendations",
        "Uploading a PDF is optional. The server extracts text locally and detects skills and a mobile number for your review; it stores the document, a limited excerpt and detected information. Nothing is automatically added to your profile: choose the detected skills and optionally the phone number to apply. You can remove the résumé separately. No external AI model receives your résumé in this implementation. Matching is an explainable content-based baseline. Scores describe profile-to-listing relevance, not a hiring probability, eligibility determination or employment guarantee. Ask PESO staff to review a suggestion or correct your profile.",
      ],
      [
        "Why information is used",
        "Information supports account access, employment profiling, matching and referral, training and skills development, service coordination, placement and outcome monitoring. Authentication also processes session identifiers, request IP addresses and security-related activity. Registration records the accepted terms version and the privacy notice version shown. Enrollment requests record the acceptance time and named provider; a notice version is recorded when the client supplies the recognized version. Historical records are not backfilled. Acknowledging this notice is not blanket consent for unrelated processing or marketing. The operator must document the lawful basis for each purpose, including sensitive information; this academic draft does not establish a statutory public-authority mandate.",
      ],
      [
        "Who can access information",
        "You can access your own profile and service records. Authorized PESO staff and administrators review information needed for facilitation. Employers can see relevant referrals to their own vacancies after PESO referral; providers can see enrollments for their own programs. Those records include your name and relevant service details. Your private PDF download is available to your own account, not a public link. Administrators review privacy requests. Hosting, database and backup administrators may have operational access and must be bound by approved controls.",
      ],
      [
        "External services",
        "Source links take you to official PESO job boards, TESDA or another named provider. Visiting or applying there is governed by their notices. PesoMatch does not automatically send your profile to those sites or certify an external enrollment. Fonts and scripts are served locally; no analytics, advertising, marketing email or payment processor is enabled in the active application. The hosting location, processor agreements and any cross-border transfers still need operator assessment.",
      ],
      [
        "Storage and retention",
        "Passwords are hashed. New private résumé uploads and session data are encrypted by the application. Existing legacy PDFs and database profile fields have not been bulk rewritten. Infrastructure, database and backup encryption require deployment verification. No approved record-by-record retention schedule is configured; profile and service records currently remain until account deletion or an authorized reviewed action. The operator must set justified retention periods, backup expiry and legal holds before launch, rather than retain records indefinitely.",
      ],
      [
        "Your choices and rights",
        "Review or edit your information in Profile and Account Settings. Settings also lets you submit an access, correction, deletion, restriction or privacy question request and follow the response. This records a request for human review; it does not itself erase data. Account deletion requires your password and removes the live account, résumé, profile and linked service records. Audit entries and privacy request records may remain with the account link removed; free text and backups need separate retention review. Deletion can be limited by valid legal obligations, and the operator must explain any refusal. For assistance before signing in, the operator privacy contact is not yet configured. You may also approach the Philippine National Privacy Commission through its official website.",
      ],
      [
        "Young jobseekers",
        "If you are under 18: use your own accurate information, do not upload IDs or private family information, and ask a parent, guardian or PESO officer for help understanding a request. Your profile is not public. Do not use this draft notice as evidence that guardian requirements have been met. PESO programs may legitimately serve minors; age eligibility, child-friendly explanations and any required guardian authorization must be settled by the operator before accepting minor participants in production.",
      ],
      [
        "Changes and contact",
        "Material changes must be explained and any new consent-based purpose must be offered separately. Questions can be recorded under Settings → Your privacy requests. Operator legal identity, postal address, privacy officer and external support contact: not configured; publication pending verification.",
      ],
    ],
  },
  "/terms": {
    title: "Terms of Use",
    sections: [
      [
        "Draft service terms",
        "Draft v2026-10-13 for the academic PesoMatch platform. Responsible operator and contact details are pending verification. These terms need organizational and legal approval before public deployment. They do not claim affiliation, endorsement or official partnership with PESO, DOLE, TESDA or listed employers.",
      ],
      [
        "Account responsibilities",
        "Provide accurate information, protect your password and use an account you are authorized to operate. Public registration creates a jobseeker account. Only administrators provision officer and partner roles. Do not impersonate another person, share access, harass others, submit malicious files, scrape private records, evade security controls or use the platform unlawfully. Report incorrect information through a privacy request or the verified operator support channel once available.",
      ],
      [
        "Services and decisions",
        "The platform supports profiling, vacancy management, matching and referral, training enrollment, skills recommendations, employment facilitation, placement, labor market information and employment outcome monitoring. Recommendations are advisory. PESO staff review referrals and verify placements; training providers confirm enrollment and completion; employers make hiring decisions. No placement, qualification, certificate or job offer is guaranteed. A provider completion reference is not a TESDA National Certificate.",
      ],
      [
        "Listings, samples and external sites",
        "Sample records are labeled fictional. Official-source listings show a source and check date, which does not establish present availability or a partner relationship. Confirm conditions, dates and eligibility on the official source. External applications and enrollments occur on the provider website and are not automatically verified by PesoMatch. Local labor-market totals describe platform records, not nationwide employment statistics.",
      ],
      [
        "Fees and communications",
        "The current platform has no checkout, paid subscription or payment collection. A program fee shown in a listing is provider information; confirm all costs with that provider before enrolling. PesoMatch cannot process refunds for payments made elsewhere. No marketing emails are sent. Email verification and password recovery are not enabled in this development version; do not rely on them for account recovery. Operational support arrangements must be established before launch.",
      ],
      [
        "Privacy and leaving",
        "Read the Privacy Policy and Cookie Policy. Terms acceptance is separate from any future optional marketing consent. You can withdraw eligible requests, edit your profile, make a privacy request or delete your account in Settings. Deletion is permanent in the live account system; retained audit information, lawful holds and backups require operator review. No term limits non-waivable rights under applicable law.",
      ],
      [
        "Operation and disputes",
        "Do not rely on this academic deployment for urgent or legally time-sensitive employment services. Availability, support, suspension procedures, complaint handling, governing terms and any changes must be approved by the identified operator. No broad liability waiver or invented governing-law arrangement is asserted by this draft. Contact and complaint channel: pending verified operator details.",
      ],
    ],
  },
  "/cookies": {
    title: "Cookies & Device Storage",
    sections: [
      [
        "What the current platform uses",
        "Draft v2026-10-13. The active application uses necessary first-party Laravel session and XSRF-TOKEN cookies for account authentication and protection against forged requests. The session cookie is HttpOnly; the CSRF cookie must be readable by the client to send the request token. Sessions currently expire after 120 minutes of inactivity, subject to server configuration; cookies are renewed during use. If persistent sign-in is explicitly requested, its separate HttpOnly cookie lasts up to 7 days. The current sign-in screen does not request persistent sign-in. Sign out on shared devices. Production requires HTTPS and Secure cookies.",
      ],
      [
        "Your preferences",
        "The peso-appearance localStorage entry remembers your chosen light/dark theme and larger-text setting until you clear it. Session storage may hold a temporary tutorial flag until the browser session ends; tutorial completion is also saved to your account. Android stores its chosen platform address in private application preferences. These preferences do not contain your résumé or profile.",
      ],
      [
        "Installed applications",
        "The PWA service worker caches the offline page, icons and requested public static code/font assets. It does not cache personal API responses, authenticated service records or queue form submissions. Browser, device and network history may still exist. Downloaded PDFs and CSV files are copies you control; removing your account cannot erase copies already saved on a device.",
      ],
      [
        "Tracking and controls",
        "No advertising cookies, analytics SDKs or other non-essential third-party tracking are enabled in the active application. A tracking consent banner is therefore not presented as if such tracking existed. If tracking is added, reassess applicable law and block consent-based tracking until an informed choice. You can clear site data or block cookies in your browser, but blocking necessary cookies prevents sign-in. Linked external websites have their own cookie policies.",
      ],
    ],
  },
}
