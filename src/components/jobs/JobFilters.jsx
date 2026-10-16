import { useId } from "react"

import { Search, X } from "lucide-react"

import { Button, Modal, panel } from "../common/UI.jsx"

export const filterFields = [
  ["category", "Job Category"],

  ["location", "Location"],

  ["employmentType", "Employment Type"],

  ["experienceLevel", "Experience Level"],

  ["educationLevel", "Education Level"],

  ["workArrangement", "Work Arrangement"],

  ["matchLabel", "Match Classification"],
]

export function JobSearchBar({ query, onChange, onSubmit }) {
  return (
    <form
      aria-label="Search job opportunities"
      onSubmit={(event) => {
        event.preventDefault()

        onSubmit()
      }}
      className="mb-4 flex gap-2"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search jobs</span>
        <Search
          size={17}
          className="absolute left-3 top-3.5 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Job title, skill, or employer"
          className="min-h-12 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm"
        />
      </label>
      <Button type="submit" className="text-xs">
        Search
      </Button>
    </form>
  )
}

export function JobFilterPanel({
  jobs,

  values,

  onChange,

  onApply,

  onClear,

  mobile = false,
}) {
  const filterId = useId()

  const explicit = {
    employmentType: ["Full-time", "Part-time", "Contract", "Temporary"],

    workArrangement: ["On-site", "Hybrid", "Remote"],

    experienceLevel: [
      "No experience required",

      "Entry level",

      "1-2 years",

      "3+ years",
    ],

    educationLevel: [
      "Senior High School",

      "Vocational / TESDA",

      "College Level",

      "College Graduate",
    ],

    matchLabel: ["Strong Match", "Potential Match", "Possible Match"],
  }

  return (
    <form
      aria-label={mobile ? "Mobile job filters" : "Job filters"}
      onSubmit={(event) => {
        event.preventDefault()

        onApply()
      }}
      className="space-y-4"
    >
      <h2 className="text-sm font-semibold">Refine opportunities</h2>
      {filterFields.map(([key, label]) => (
        <label
          key={key}
          htmlFor={`${filterId}-${key}`}
          className="block text-xs font-medium"
        >
          {label}
          <select
            id={`${filterId}-${key}`}
            aria-label={label}
            value={values[key] || ""}
            onChange={(event) => onChange(key, event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-2 text-xs font-normal"
          >
            <option value="">All</option>
            {(explicit[key] || [...new Set(jobs.map((job) => job[key]))]).map(
              (option) => (
                <option key={option}>{option}</option>
              ),
            )}
          </select>
        </label>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="w-full text-xs">
          Apply Filters
        </Button>
        <Button variant="text" onClick={onClear} className="w-full text-xs">
          Clear Filters
        </Button>
      </div>
    </form>
  )
}

export function JobFilterDrawer({ open, onClose, ...props }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter job opportunities"
      placement="sheet"
    >
      <JobFilterPanel
        {...props}
        mobile
        onApply={() => {
          props.onApply()

          onClose()
        }}
      />
    </Modal>
  )
}

export function SelectedFilters({ values, onRemove, onClear }) {
  const entries = Object.entries(values).filter(([, value]) => value)

  return (
    entries.length > 0 && (
      <div
        aria-label="Active job filters"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        {entries.map(([key, value]) => (
          <button
            key={key}
            onClick={() => onRemove(key)}
            aria-label={`Remove ${value} filter`}
            className="flex min-h-9 max-w-full items-center gap-2 rounded-md bg-secondary px-3 text-xs text-primary"
          >
            <span className="truncate">{value}</span>
            <X size={13} />
          </button>
        ))}
        <button
          onClick={onClear}
          className="min-h-9 text-xs font-medium text-primary hover:underline"
        >
          Clear All
        </button>
      </div>
    )
  )
}
