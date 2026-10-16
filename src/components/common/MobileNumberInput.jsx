import { useId, useState } from "react"

export default function MobileNumberInput({
  value = "",

  onChange,

  required = false,
}) {
  const id = useId(),
    [touched, setTouched] = useState(false)

  const invalid =
    (required && !value) || (!!value && !/^9[0-9]{9}$/.test(value))

  const error = touched && invalid

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        Mobile number {required ? "*" : "(optional)"}
      </label>
      <div
        className={`mt-2 flex min-h-12 overflow-hidden rounded-lg border bg-white ${
          error ? "border-[#a53232]" : "border-[#dce1ed]"
        }`}
      >
        <span className="flex items-center border-r border-border px-3 text-sm text-muted-foreground">
          +63
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          pattern="9[0-9]{9}"
          placeholder="9XX XXX XXXX"
          aria-invalid={error || undefined}
          aria-describedby={`${id}-hint`}
          value={value}
          onBlur={() => setTouched(true)}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base"
        />
      </div>
      <p
        id={`${id}-hint`}
        className={`mt-2 text-xs leading-5 ${
          error ? "text-[#a53232]" : "text-muted-foreground"
        }`}
      >
        {error
          ? "Enter 10 digits starting with 9. Do not include +63 or a leading 0."
          : "Enter 10 digits starting with 9. The +63 prefix is already included."}
      </p>
    </div>
  )
}
