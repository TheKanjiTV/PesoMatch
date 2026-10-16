// The original open P, shared across the portal and workspace.

export function PesoMark({ className = "size-12" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 25V7h9a6 6 0 010 12h-3M13 25V13h3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
