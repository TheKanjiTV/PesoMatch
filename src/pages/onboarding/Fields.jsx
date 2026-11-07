import { useId, useState } from "react"

import { Plus, Search, Trash2, X } from "lucide-react"

import { Field as InputField } from "../../app/auth/components.jsx"

import { Button } from "../../components/common/UI.jsx"

import { courseGroups, coursePrograms } from "../../data/educationOptions.js"

export function ErrorMessage({ id, children }) {
  return children ? (
    <p id={id} className="mt-2 text-xs leading-5 text-error-ink">
      {children}
    </p>
  ) : null
}

export function FormField({
  label,

  options,

  textarea,

  error,

  helper,

  ...props
}) {
  const id = useId()

  if (!options && !textarea)
    return <InputField label={label} error={error} helper={helper} {...props} />

  const style = `mt-2 min-h-12 w-full rounded-lg border bg-card px-3 py-2.5 text-base text-foreground ${
    error ? "border-[#a53232]" : "border-[#dfe4ee]"
  }`

  const shared = {
    ...props,

    id,

    className: style,

    "aria-invalid": !!error,

    "aria-describedby": error || helper ? `${id}-message` : undefined,
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <select {...shared}>
          <option value="" disabled hidden>
            Choose an option
          </option>
          {options.map((option) =>
            option.options ? (
              <optgroup key={option.label} label={option.label}>
                {option.options.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option
                key={option.value ?? option}
                value={option.value ?? option}
              >
                {option.label ?? option}
              </option>
            ),
          )}
        </select>
      ) : (
        <textarea rows={3} {...shared} />
      )}
      {error ? (
        <ErrorMessage id={`${id}-message`}>{error}</ErrorMessage>
      ) : helper ? (
        <p
          id={`${id}-message`}
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          {helper}
        </p>
      ) : null}
    </div>
  )
}

export function CourseProgramField({ value, onChange, error }) {
  const [custom, setCustom] = useState(
    () =>
      !!value && !coursePrograms.includes(value) && value !== "Not applicable",
  )

  return (
    <div className="space-y-3">
      <FormField
        label="Course / Program (optional)"
        value={custom ? "__other" : value || ""}
        error={error}
        options={[
          ...courseGroups,
          "Not applicable",
          { value: "__other", label: "Other course / program" },
        ]}
        onChange={(event) => {
          const other = event.target.value === "__other"

          setCustom(other)

          onChange(other ? "" : event.target.value)
        }}
      />
      {custom && (
        <FormField
          label="Other course / program"
          value={value || ""}
          maxLength={255}
          onChange={(event) => onChange(event.target.value)}
          helper="Enter your program's name as listed by your school."
        />
      )}
    </div>
  )
}

export function PhilippineMobile({ value, onChange, error }) {
  const national = value

    .replace(/^\+63|^63|^0/, "")

    .replace(/\D/g, "")

    .slice(0, 10)

  const display = national

    .replace(/^(\d{3})(\d)/, "$1 $2")

    .replace(/^(\d{3}) (\d{3})(\d)/, "$1 $2 $3")

  return (
    <InputField
      label="Mobile Number"
      required
      type="tel"
      autoComplete="tel-national"
      inputMode="numeric"
      prefix="+63"
      placeholder="917 123 4567"
      value={display}
      error={error}
      helper="10 digits starting with 9. The +63 prefix is already included."
      onChange={(event) => {
        const digits = event.target.value

          .replace(/\D/g, "")

          .replace(/^(63|0)(?=9)/, "")

          .slice(0, 10)

        onChange(digits ? `+63${digits}` : "")
      }}
    />
  )
}

export function TagSelector({
  label,

  options,

  values,

  onChange,

  error,

  allowCustom = false,

  notify,

  description,
}) {
  const [query, setQuery] = useState("")

  const id = useId()

  const filtered = options

    .filter(
      (option) =>
        !values.includes(option.id) &&
        option.name.toLowerCase().includes(query.trim().toLowerCase()),
    )

    .slice(0, 12)

  const add = (value) => {
    if (!values.includes(value)) onChange([...values, value])

    setQuery("")
  }

  const remove = (value) => {
    const index = values.indexOf(value)

    onChange(values.filter((item) => item !== value))

    notify(`${label === "Skills" ? "Skill" : "Occupation"} removed.`, {
      undo: () =>
        onChange((latest) =>
          latest.includes(value)
            ? latest
            : [...latest.slice(0, index), value, ...latest.slice(index)],
        ),
    })
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold">
        {label} <span aria-hidden="true">*</span>
      </legend>
      {description && (
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {values.length > 0 && (
        <ul
          className="mb-3 mt-3 flex flex-wrap gap-2"
          aria-label={`Selected ${label.toLowerCase()}`}
        >
          {values.map((value) => (
            <li
              key={value}
              className="flex items-center gap-1 rounded-lg bg-secondary pl-3 text-sm text-primary"
            >
              {options.find((option) => option.id === value)?.name || value}
              <button
                type="button"
                aria-label={`Remove ${options.find((option) => option.id === value)?.name || value}`}
                className="flex size-11 items-center justify-center rounded-lg hover:bg-primary/10"
                onClick={() => remove(value)}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={id} className="sr-only">
        Search {label.toLowerCase()}
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          size={17}
          className="absolute left-3 top-4 text-muted-foreground"
        />
        <input
          id={id}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={
            allowCustom
              ? "Search or type an occupation"
              : "Search available skills"
          }
          className="min-h-12 w-full rounded-lg border border-[#dfe4ee] bg-card pl-10 pr-3 text-base"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()

              if (allowCustom && query.trim()) add(query.trim())
            }
          }}
        />
      </div>
      <div
        className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-auto py-1"
        aria-label={`Available ${label.toLowerCase()}`}
      >
        {filtered.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => add(option.id)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-primary hover:bg-secondary"
          >
            <Plus size={13} />
            {option.name}
          </button>
        ))}
        {allowCustom &&
          query.trim() &&
          !options.some(
            (option) =>
              option.name.toLowerCase() === query.trim().toLowerCase(),
          ) &&
          !values.includes(query.trim()) && (
            <Button variant="secondary" onClick={() => add(query.trim())}>
              Add &ldquo;{query.trim()}&rdquo;
            </Button>
          )}
        {!filtered.length && !allowCustom && (
          <p className="py-2 text-xs text-muted-foreground">
            {query
              ? "No other skills match your search."
              : "All available skills selected."}
          </p>
        )}
      </div>
      <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>
    </fieldset>
  )
}

export function CheckGroup({ legend, options, value, onChange, error }) {
  const id = useId()

  return (
    <fieldset
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
    >
      <legend className="mb-3 text-sm font-medium">
        {legend} <span aria-hidden="true">*</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
              value.includes(option)
                ? "border-primary bg-secondary text-primary"
                : "border-border bg-card"
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, option]
                    : value.filter((item) => item !== option),
                )
              }
              className="size-4 accent-primary"
            />
            {option}
          </label>
        ))}
      </div>
      <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>
    </fieldset>
  )
}

export function RepeatableSection({
  title,

  description,

  items,

  onAdd,

  onRemove,

  children,
}) {
  return (
    <section className="border-t border-border pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-primary">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={onAdd}>
          <Plus size={15} />
          Add{" "}
          {title === "Work Experience" ? "Experience" : title.replace(/s$/, "")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <fieldset
            key={item._key || index}
            className="rounded-lg border border-border bg-background p-4"
          >
            <legend className="px-1 text-xs font-semibold text-primary">
              {title === "Work Experience"
                ? "Experience"
                : title.replace(/s$/, "")}{" "}
              {index + 1}
            </legend>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${
                  title === "Work Experience"
                    ? "experience"
                    : title.replace(/s$/, "").toLowerCase()
                } ${index + 1}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-error-ink hover:bg-error-surface"
              >
                <Trash2 size={15} />
                Remove
              </button>
            </div>
            {children(item, index)}
          </fieldset>
        ))}
      </div>
    </section>
  )
}
